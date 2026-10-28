// Les vérifications de Rempart.
// probe     : script PowerShell qui renvoie une table de valeurs (lecture seule).
// evaluate  : (valeurs) -> { status: 'ok' | 'warn' | 'ko' | 'na', detail }.
// onError   : (message) -> résultat de remplacement quand l'erreur signifie « sans objet ».
// fix.reg   : valeurs de registre à poser ; l'état d'avant est sauvegardé puis restauré à l'identique.
// fix.apply : script qui corrige et renvoie l'état d'avant ; fix.undo le remet à partir de $before.
// fix.admin : false quand la correction concerne l'utilisateur (HKCU) et ne doit pas être élevée.
// open      : réglage Windows à ouvrir quand la correction doit être faite à la main.
const R = String.raw;

const POL_SYS = R`HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System`;
const LSA = R`HKLM:\SYSTEM\CurrentControlSet\Control\Lsa`;
const TS = R`HKLM:\SYSTEM\CurrentControlSet\Control\Terminal Server`;
const EXPL = R`HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer`;

const regProbe = (...pairs) => '@{ ' + pairs.map(([k, p, n]) => `${k} = (RegVal '${p}' '${n}')`).join('; ') + ' }';
const dword = (path, name, value) => ({ path, name, value, kind: 'DWord' });

// Defender en mode passif : un autre antivirus est le principal, ses réglages ne comptent pas
const passive = v => v.mode && !/^normal/i.test(v.mode)
  ? { status: 'na', detail: `Microsoft Defender est en mode « ${v.mode} » : un autre antivirus assure la protection.` }
  : null;
const days = iso => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;

// Validation des sauvegardes avant une annulation : le fichier de sauvegarde est modifiable par tout programme de
// l'utilisateur, on n'accepte donc que la forme exacte de l'état que la correction a pu enregistrer.
const isBool = v => typeof v === 'boolean';
const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const onlyKeys = (o, keys) => o && typeof o === 'object' && !Array.isArray(o) && Object.keys(o).every(k => keys.includes(k));
const FEATURE_STATES = ['Enabled', 'Disabled', 'DisabledWithPayloadRemoved', 'EnablePending', 'DisablePending'];
const REG_KINDS = { DWord: v => isInt(v, -2147483648, 4294967295), QWord: v => Number.isFinite(v), String: v => typeof v === 'string' && v.length < 4096,
  ExpandString: v => typeof v === 'string' && v.length < 4096, MultiString: v => Array.isArray(v) && v.every(x => typeof x === 'string'),
  Binary: v => Array.isArray(v) && v.length < 65536 && v.every(x => isInt(x, 0, 255)) };
// Sauvegarde produite par regApply : une entrée par valeur déclarée dans fix.reg, ni plus ni moins
function validRegBackup(fix, b) {
  if (!b || !Array.isArray(b.reg) || b.reg.length !== fix.reg.length) return false;
  return b.reg.every((r, i) => r && r.p === fix.reg[i].path && r.n === fix.reg[i].name
    && (r.existe === false || (r.existe === true && REG_KINDS[r.k] && REG_KINDS[r.k](r.v))));
}

const checks = [
  // ───────────── Antivirus ─────────────
  {
    id: 'av', cat: 'Antivirus', sev: 'critique', title: 'Un antivirus est actif',
    why: "Sans antivirus actif, un fichier piégé ouvert depuis un e-mail ou une clé USB s'exécute sans aucun contrôle.",
    probe: R`@{ produits = @(Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntiVirusProduct | ForEach-Object { @{ nom = [string]$_.displayName; etat = [int]$_.productState } }) }`,
    evaluate: v => {
      const all = v.produits || [];
      const on = all.filter(p => (p.etat & 0x1000) !== 0);
      if (on.length) return { status: 'ok', detail: `Actif : ${on.map(p => p.nom).join(', ')}.` };
      return { status: 'ko', detail: all.length ? `Installé mais désactivé : ${all.map(p => p.nom).join(', ')}.` : 'Aucun antivirus détecté.' };
    },
    open: 'windowsdefender://threat',
  },
  {
    id: 'def_rt', cat: 'Antivirus', sev: 'critique', title: 'Protection en temps réel de Defender',
    why: "La protection en temps réel analyse chaque fichier au moment où il est ouvert ou téléchargé. Désactivée, Defender ne voit les menaces qu'au prochain scan manuel.",
    probe: R`$m = DefStat; @{ mode = [string]$m.AMRunningMode; rt = [bool]$m.RealTimeProtectionEnabled }`,
    evaluate: v => passive(v) || (v.rt
      ? { status: 'ok', detail: 'Activée.' }
      : { status: 'ko', detail: 'Désactivée : les fichiers ne sont pas analysés à l\'ouverture.' }),
    fix: {
      label: 'Réactiver', desc: 'Réactive la protection en temps réel de Microsoft Defender.',
      apply: R`$b = @{ v = [bool](DefPref).DisableRealtimeMonitoring }; Set-MpPreference -DisableRealtimeMonitoring $false; $b`,
      undo: R`Set-MpPreference -DisableRealtimeMonitoring ([bool]$before.v)`,
      validate: b => isBool(b.v),
    },
    open: 'windowsdefender://threatsettings',
  },
  {
    id: 'def_sig', cat: 'Antivirus', sev: 'elevee', title: 'Définitions de virus à jour',
    why: "Chaque jour, de nouveaux logiciels malveillants apparaissent. Des définitions vieilles de plus d'une semaine laissent passer les menaces récentes.",
    probe: R`$m = DefStat; @{ mode = [string]$m.AMRunningMode; age = [int]$m.AntivirusSignatureAge; date = $m.AntivirusSignatureLastUpdated.ToString('o') }`,
    evaluate: v => {
      const p = passive(v); if (p) return p;
      const age = v.date ? days(v.date) : v.age;
      if (age <= 2) return { status: 'ok', detail: age === 0 ? "Mises à jour aujourd'hui." : `Mises à jour il y a ${plural(age, 'jour')}.` };
      return { status: age <= 7 ? 'warn' : 'ko', detail: `Dernière mise à jour il y a ${plural(age, 'jour')}.` };
    },
    fix: { label: 'Mettre à jour', desc: 'Télécharge les dernières définitions de virus de Microsoft Defender.', harmless: true, apply: R`Update-MpSignature; @{}` },
  },
  {
    id: 'def_tamper', cat: 'Antivirus', sev: 'elevee', title: 'Protection contre les falsifications',
    why: "Les logiciels malveillants essaient souvent de désactiver l'antivirus avant d'agir. Cette protection empêche toute modification des réglages de Defender par un programme.",
    probe: R`$m = DefStat; @{ mode = [string]$m.AMRunningMode; tp = [bool]$m.IsTamperProtected }`,
    evaluate: v => passive(v) || (v.tp
      ? { status: 'ok', detail: 'Activée.' }
      : { status: 'ko', detail: 'Désactivée : un programme peut couper Defender.' }),
    manual: "Par conception, Windows interdit de l'activer par programme : elle se règle uniquement dans Sécurité Windows.",
    open: 'windowsdefender://threatsettings',
  },
  {
    id: 'def_pua', cat: 'Antivirus', sev: 'moyenne', title: 'Blocage des applications potentiellement indésirables',
    why: 'Bloque les logiciels publicitaires, les barres d\'outils et les « optimiseurs » souvent cachés dans des installateurs gratuits.',
    probe: R`@{ mode = [string](DefStat).AMRunningMode; pua = [int](DefPref).PUAProtection }`,
    evaluate: v => passive(v) || (v.pua === 1
      ? { status: 'ok', detail: 'Activé.' }
      : { status: 'warn', detail: v.pua === 2 ? 'En mode audit : détecte sans bloquer.' : 'Désactivé.' }),
    fix: {
      label: 'Activer', desc: 'Active le blocage des applications potentiellement indésirables dans Defender.',
      apply: R`$b = @{ v = [int](DefPref).PUAProtection }; Set-MpPreference -PUAProtection 1; $b`,
      undo: R`Set-MpPreference -PUAProtection ([int]$before.v)`,
      validate: b => isInt(b.v, 0, 2),
    },
  },
  {
    id: 'def_cfa', cat: 'Antivirus', sev: 'moyenne', title: "Dispositif d'accès contrôlé aux dossiers (anti-rançongiciel)",
    why: 'Empêche les programmes inconnus de modifier vos Documents, Images et Bureau : un rançongiciel ne peut alors pas chiffrer vos fichiers.',
    probe: R`@{ mode = [string](DefStat).AMRunningMode; cfa = [int](DefPref).EnableControlledFolderAccess }`,
    evaluate: v => passive(v) || (v.cfa === 1
      ? { status: 'ok', detail: 'Activé.' }
      : { status: 'warn', detail: v.cfa === 2 ? 'En mode audit : détecte sans bloquer.' : 'Désactivé.' }),
    fix: {
      label: 'Activer',
      desc: "Active la protection des dossiers. Certains logiciels légitimes (jeux, outils photo) peuvent être bloqués : vous pourrez les autoriser dans Sécurité Windows.",
      apply: R`$b = @{ v = [int](DefPref).EnableControlledFolderAccess }; Set-MpPreference -EnableControlledFolderAccess 1; $b`,
      undo: R`Set-MpPreference -EnableControlledFolderAccess ([int]$before.v)`,
      validate: b => isInt(b.v, 0, 6),
    },
    open: 'windowsdefender://ransomwareprotection',
  },
  {
    id: 'smartscreen', cat: 'Antivirus', sev: 'elevee', title: 'SmartScreen pour les applications',
    why: "SmartScreen avertit avant de lancer un programme téléchargé inconnu ou signalé comme dangereux : c'est souvent le dernier rempart contre un faux installateur.",
    probe: regProbe(['exp', EXPL, 'SmartScreenEnabled'], ['pol', R`HKLM:\SOFTWARE\Policies\Microsoft\Windows\System`, 'EnableSmartScreen']),
    evaluate: v => {
      if (v.pol === 0) return { status: 'ko', detail: 'Désactivé par une stratégie de groupe.' };
      if (/^off$/i.test(v.exp || '')) return { status: 'ko', detail: 'Désactivé.' };
      return { status: 'ok', detail: v.exp ? `Activé (« ${v.exp} »).` : 'Activé (réglage par défaut).' };
    },
    fix: { label: 'Activer', desc: 'Réactive SmartScreen en mode « Avertir ».', reg: [{ path: EXPL, name: 'SmartScreenEnabled', value: 'Warn', kind: 'String' }] },
  },

  // ───────────── Système ─────────────
  {
    id: 'updates', cat: 'Système', sev: 'critique', title: 'Mises à jour de Windows récentes',
    why: "La plupart des attaques exploitent des failles déjà corrigées par Microsoft. Chaque mois sans mise à jour laisse des failles connues ouvertes.",
    probe: R`
      $s = New-Object -ComObject Microsoft.Update.Session
      $h = $s.CreateUpdateSearcher()
      $n = $h.GetTotalHistoryCount()
      $ok = @()
      if ($n -gt 0) { $ok = @($h.QueryHistory(0, [Math]::Min($n, 300)) | Where-Object { $_.ResultCode -eq 2 -and $_.Operation -eq 1 -and $_.Title -notmatch '2267602|4052623|890830|Defender|Intelligence|^[0-9A-Z]{12}-' } | Sort-Object Date -Descending) }
      # La mise à jour mensuelle de Windows porte le numéro de build : « (26200.9711) »
      $build = RegVal 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion' 'CurrentBuild'
      $u = $ok | Where-Object { $_.Title -match "\($build\.\d+\)" -or $_.Title -match 'cumulati' } | Select-Object -First 1
      if (-not $u) { $u = $ok | Select-Object -First 1 }
      if ($u) { @{ date = ([datetime]$u.Date).ToString('o'); titre = [string]$u.Title } }
      else {
        $hf = Get-HotFix | Where-Object InstalledOn | Sort-Object InstalledOn -Descending | Select-Object -First 1
        @{ date = $(if ($hf) { ([datetime]$hf.InstalledOn).ToString('o') } else { $null }); titre = $(if ($hf) { [string]$hf.HotFixID } else { $null }) }
      }`,
    evaluate: v => {
      if (!v.date) return { status: 'ko', detail: 'Aucune mise à jour installée trouvée.' };
      const d = days(v.date);
      const when = `Dernière mise à jour il y a ${plural(d, 'jour')}${v.titre ? ` : ${v.titre}` : ''}.`;
      return { status: d <= 40 ? 'ok' : d <= 70 ? 'warn' : 'ko', detail: when };
    },
    open: 'ms-settings:windowsupdate',
  },
  {
    id: 'uac', cat: 'Système', sev: 'critique', title: 'Contrôle de compte d\'utilisateur (UAC)',
    why: "L'UAC demande votre accord avant qu'un programme obtienne les droits administrateur. Sans lui, n'importe quel logiciel peut modifier tout le système en silence.",
    probe: regProbe(['lua', POL_SYS, 'EnableLUA'], ['cpba', POL_SYS, 'ConsentPromptBehaviorAdmin'], ['sd', POL_SYS, 'PromptOnSecureDesktop']),
    evaluate: v => {
      if (v.lua === 0) return { status: 'ko', detail: "L'UAC est complètement désactivé." };
      if (v.cpba === 0) return { status: 'ko', detail: 'Les programmes obtiennent les droits administrateur sans rien demander.' };
      if (v.sd === 0) return { status: 'warn', detail: "La demande d'autorisation n'apparaît pas sur le bureau sécurisé : un programme peut cliquer « Oui » à votre place." };
      return { status: 'ok', detail: 'Activé, avec demande sur le bureau sécurisé.' };
    },
    fix: {
      label: 'Rétablir', desc: "Rétablit l'UAC avec les réglages recommandés par Microsoft (demande de consentement sur le bureau sécurisé).", restart: true,
      reg: [dword(POL_SYS, 'EnableLUA', 1), dword(POL_SYS, 'ConsentPromptBehaviorAdmin', 5), dword(POL_SYS, 'PromptOnSecureDesktop', 1)],
    },
  },
  {
    id: 'bitlocker', cat: 'Système', sev: 'elevee', admin: true, title: 'Chiffrement du disque système',
    why: "Si votre PC portable est volé, un disque non chiffré se lit en quelques minutes depuis un autre ordinateur, même sans connaître votre mot de passe.",
    probe: R`$v = Get-CimInstance -Namespace root/CIMV2/Security/MicrosoftVolumeEncryption -ClassName Win32_EncryptableVolume -Filter "DriveLetter='$env:SystemDrive'"; if (-not $v) { @{ absent = $true } } else { @{ statut = [int]$v.ProtectionStatus; lecteur = $env:SystemDrive } }`,
    onError: e => /namespace|espace de noms/i.test(e) ? { status: 'na', detail: 'Le chiffrement de lecteur n\'est pas disponible sur cet appareil.' } : null,
    evaluate: v => {
      if (v.absent) return { status: 'na', detail: 'Le chiffrement de lecteur n\'est pas disponible sur cet appareil.' };
      if (v.statut === 1) return { status: 'ok', detail: `Le lecteur ${v.lecteur} est chiffré et protégé.` };
      if (v.statut === 2) return { status: 'warn', detail: `État du lecteur ${v.lecteur} indéterminé (verrouillé).` };
      return { status: 'ko', detail: `Le lecteur ${v.lecteur} n'est pas chiffré.` };
    },
    manual: "Le chiffrement se lance à la main : Windows vous donne une clé de récupération qu'il faut absolument conserver (compte Microsoft, papier).",
    open: 'ms-settings:deviceencryption',
  },
  {
    id: 'secureboot', cat: 'Système', sev: 'moyenne', title: 'Démarrage sécurisé (Secure Boot)',
    why: "Le démarrage sécurisé empêche les « bootkits », des logiciels malveillants qui se lancent avant Windows et échappent ainsi à l'antivirus.",
    probe: regProbe(['v', R`HKLM:\SYSTEM\CurrentControlSet\Control\SecureBoot\State`, 'UEFISecureBootEnabled']),
    evaluate: v => v.v === 1 ? { status: 'ok', detail: 'Activé.' }
      : v.v === 0 ? { status: 'ko', detail: 'Désactivé dans le micrologiciel (UEFI).' }
      : { status: 'warn', detail: 'Le PC démarre en mode BIOS hérité, sans démarrage sécurisé.' },
    manual: "Il s'active dans le menu UEFI/BIOS du PC (touche Suppr, F2 ou F10 au démarrage, selon le fabricant).",
  },
  {
    id: 'hvci', cat: 'Système', sev: 'moyenne', title: "Intégrité de la mémoire (isolation du noyau)",
    why: "Empêche un pilote ou un logiciel malveillant d'injecter du code dans le cœur de Windows, même s'il a obtenu les droits administrateur.",
    probe: R`$dg = $null; try { $dg = Get-CimInstance -Namespace root/Microsoft/Windows/DeviceGuard -ClassName Win32_DeviceGuard } catch {}
      @{ reg = (RegVal 'HKLM:\SYSTEM\CurrentControlSet\Control\DeviceGuard\Scenarios\HypervisorEnforcedCodeIntegrity' 'Enabled'); actif = $(if ($dg) { [bool](@($dg.SecurityServicesRunning) -contains 2) } else { $null }) }`,
    evaluate: v => v.actif ? { status: 'ok', detail: 'Activée et en fonctionnement.' }
      : v.reg === 1 ? { status: 'warn', detail: 'Activée, mais pas encore en fonctionnement : redémarrez le PC.' }
      : { status: 'ko', detail: 'Désactivée.' },
    manual: "Se règle dans Sécurité Windows, qui vérifie d'abord la compatibilité de vos pilotes (un pilote incompatible pourrait empêcher Windows de démarrer).",
    open: 'windowsdefender://coreisolation',
  },
  {
    id: 'lsa_ppl', cat: 'Système', sev: 'moyenne', title: 'Protection LSA (vol de mots de passe en mémoire)',
    why: "Le processus LSA garde vos identifiants en mémoire. Les outils de piratage comme Mimikatz les y lisent ; la protection LSA leur en interdit l'accès.",
    probe: regProbe(['v', LSA, 'RunAsPPL']),
    evaluate: v => v.v === 1 || v.v === 2 ? { status: 'ok', detail: 'Activée.' } : { status: 'ko', detail: 'Désactivée.' },
    fix: {
      label: 'Activer', restart: true,
      desc: "Active la protection LSA. Rarement, un ancien logiciel (lecteur d'empreintes, VPN) peut cesser de fonctionner : il suffit alors d'annuler la correction.",
      reg: [dword(LSA, 'RunAsPPL', 1)],
    },
  },
  {
    id: 'wdigest', cat: 'Système', sev: 'elevee', title: 'Mots de passe en clair (WDigest)',
    why: "Quand WDigest est activé, Windows garde votre mot de passe en clair en mémoire, prêt à être volé par n'importe quel outil de piratage.",
    probe: regProbe(['v', R`HKLM:\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest`, 'UseLogonCredential']),
    evaluate: v => v.v === 1 ? { status: 'ko', detail: 'Activé : les mots de passe sont conservés en clair.' } : { status: 'ok', detail: 'Désactivé.' },
    fix: { label: 'Désactiver', desc: 'Interdit à Windows de conserver les mots de passe en clair en mémoire.', reg: [dword(R`HKLM:\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest`, 'UseLogonCredential', 0)] },
  },
  {
    id: 'psv2', cat: 'Système', sev: 'moyenne', admin: true, title: 'Ancien moteur PowerShell 2.0',
    why: "PowerShell 2.0 n'a aucune des protections modernes (journalisation, analyse antivirus des scripts). Les attaquants l'utilisent pour passer inaperçus.",
    probe: R`$f = Get-WindowsOptionalFeature -Online -FeatureName MicrosoftWindowsPowerShellV2Root; @{ etat = $(if ($f) { $f.State.ToString() } else { 'Absent' }) }`,
    onError: e => /unknown|inconnu|introuvable|not found/i.test(e) ? { status: 'ok', detail: "Absent de cette version de Windows." } : null,
    evaluate: v => v.etat === 'Enabled' ? { status: 'ko', detail: 'Installé et activé.' } : { status: 'ok', detail: v.etat === 'Absent' ? 'Absent.' : 'Désactivé.' },
    fix: {
      label: 'Désactiver', restart: true, desc: 'Retire la fonctionnalité Windows « PowerShell 2.0 » (les versions modernes de PowerShell restent disponibles). Peut prendre une minute.',
      apply: R`Disable-WindowsOptionalFeature -Online -FeatureName MicrosoftWindowsPowerShellV2Root -NoRestart | Out-Null; @{ v = 'Enabled' }`,
      undo: R`Enable-WindowsOptionalFeature -Online -FeatureName MicrosoftWindowsPowerShellV2Root -All -NoRestart | Out-Null`,
      validate: b => b.v === 'Enabled',
    },
  },
  {
    id: 'wsh', cat: 'Système', sev: 'faible', title: 'Windows Script Host (scripts .vbs et .js)',
    why: "Les pièces jointes piégées sont souvent des fichiers .vbs ou .js qui s'exécutent d'un double-clic. Désactiver Windows Script Host les rend inoffensifs.",
    probe: regProbe(['v', R`HKLM:\SOFTWARE\Microsoft\Windows Script Host\Settings`, 'Enabled']),
    evaluate: v => Number(v.v) === 0 && v.v !== null ? { status: 'ok', detail: 'Désactivé.' } : { status: 'warn', detail: 'Activé : un fichier .vbs ou .js s\'exécute d\'un double-clic.' },
    fix: {
      label: 'Désactiver', desc: "Désactive l'exécution des scripts .vbs et .js. Rare, mais certains vieux installateurs en ont besoin : annulez alors la correction le temps de l'installation.",
      reg: [dword(R`HKLM:\SOFTWARE\Microsoft\Windows Script Host\Settings`, 'Enabled', 0)],
    },
  },
  {
    id: 'autorun', cat: 'Système', sev: 'faible', title: 'Exécution automatique des supports (AutoRun)',
    why: 'Une clé USB ou un CD piégé peut lancer un programme dès son insertion si l\'exécution automatique est active.',
    probe: regProbe(['m', R`HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer`, 'NoDriveTypeAutoRun'], ['u', R`HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer`, 'NoDriveTypeAutoRun']),
    evaluate: v => v.m === 255 || v.u === 255 ? { status: 'ok', detail: 'Désactivée pour tous les types de lecteurs.' } : { status: 'warn', detail: 'Réglage par défaut : désactivée pour une partie des lecteurs seulement.' },
    fix: { label: 'Désactiver', desc: "Désactive l'exécution automatique pour tous les types de lecteurs.", reg: [dword(R`HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer`, 'NoDriveTypeAutoRun', 255)] },
  },
  {
    id: 'file_ext', cat: 'Système', sev: 'moyenne', title: 'Extensions de fichiers visibles',
    why: "Avec les extensions cachées, « facture.pdf.exe » s'affiche « facture.pdf ». C'est l'une des ruses les plus courantes des e-mails piégés.",
    probe: regProbe(['v', R`HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced`, 'HideFileExt']),
    evaluate: v => v.v === 0 ? { status: 'ok', detail: 'Les extensions sont affichées.' } : { status: 'ko', detail: 'Les extensions sont cachées.' },
    fix: {
      label: 'Afficher', admin: false, desc: "Affiche les extensions dans l'Explorateur (visible à la prochaine ouverture d'une fenêtre).",
      reg: [dword(R`HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced`, 'HideFileExt', 0)],
    },
  },

  // ───────────── Réseau ─────────────
  {
    id: 'firewall', cat: 'Réseau', sev: 'critique', title: 'Pare-feu Windows',
    why: 'Le pare-feu bloque les connexions entrantes non sollicitées. Sans lui, chaque service à l\'écoute est exposé au réseau, y compris sur un Wi-Fi public.',
    probe: R`@{ profils = @(Get-NetFirewallProfile | ForEach-Object { @{ nom = [string]$_.Name; actif = ($_.Enabled.ToString() -eq 'True') } }) }`,
    evaluate: v => {
      const fr = { Domain: 'domaine', Private: 'privé', Public: 'public' };
      const off = (v.profils || []).filter(p => !p.actif).map(p => fr[p.nom] || p.nom);
      return off.length ? { status: 'ko', detail: `Désactivé pour le profil ${off.join(', ')}.` } : { status: 'ok', detail: 'Activé pour tous les profils réseau.' };
    },
    fix: {
      label: 'Activer', desc: 'Active le pare-feu Windows pour les profils domaine, privé et public.',
      apply: R`$b = @{}; Get-NetFirewallProfile | ForEach-Object { $b[[string]$_.Name] = $_.Enabled.ToString() }; Set-NetFirewallProfile -All -Enabled True; $b`,
      undo: R`$before.PSObject.Properties | ForEach-Object { Set-NetFirewallProfile -Name $_.Name -Enabled $_.Value }`,
      validate: b => onlyKeys(b, ['Domain', 'Private', 'Public']) && Object.values(b).every(x => ['True', 'False', 'NotConfigured'].includes(x)),
    },
  },
  {
    id: 'smb1', cat: 'Réseau', sev: 'critique', admin: true, title: 'Protocole de partage SMBv1',
    why: "SMBv1 est le protocole de partage de fichiers de 1990 exploité par les rançongiciels WannaCry et NotPetya. Il n'a plus aucune raison d'être activé.",
    probe: R`$f = $null; try { $f = (Get-WindowsOptionalFeature -Online -FeatureName SMB1Protocol).State.ToString() } catch {}
      @{ serveur = [bool](Get-SmbServerConfiguration).EnableSMB1Protocol; fonction = $f }`,
    evaluate: v => v.serveur || v.fonction === 'Enabled'
      ? { status: 'ko', detail: v.serveur ? 'Le serveur SMBv1 est activé.' : 'La fonctionnalité SMBv1 est installée.' }
      : { status: 'ok', detail: 'Désactivé.' },
    fix: {
      label: 'Désactiver', restart: true, desc: 'Désactive SMBv1 côté serveur et retire la fonctionnalité Windows SMBv1.',
      apply: R`$f = $null; try { $f = (Get-WindowsOptionalFeature -Online -FeatureName SMB1Protocol).State.ToString() } catch {}
        $b = @{ v = [bool](Get-SmbServerConfiguration).EnableSMB1Protocol; f = $f }
        Set-SmbServerConfiguration -EnableSMB1Protocol $false -Force
        if ($f -eq 'Enabled') { Disable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol -NoRestart | Out-Null }
        $b`,
      undo: R`if ($before.f -eq 'Enabled') { Enable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol -All -NoRestart | Out-Null }
        Set-SmbServerConfiguration -EnableSMB1Protocol ([bool]$before.v) -Force`,
      validate: b => isBool(b.v) && (b.f == null || FEATURE_STATES.includes(b.f)),
    },
  },
  {
    id: 'rdp', cat: 'Réseau', sev: 'elevee', title: 'Bureau à distance',
    why: 'Le Bureau à distance est la porte d\'entrée favorite des attaquants, qui testent des mots de passe en masse. Il ne doit être actif que si vous vous en servez.',
    probe: regProbe(['deny', TS, 'fDenyTSConnections'], ['nla', TS + R`\WinStations\RDP-Tcp`, 'UserAuthentication']),
    evaluate: v => v.deny !== 0 ? { status: 'ok', detail: 'Désactivé.' }
      : v.nla === 1 ? { status: 'warn', detail: "Activé, avec authentification au niveau du réseau (NLA). Désactivez-le si vous ne l'utilisez pas." }
      : { status: 'ko', detail: 'Activé sans authentification au niveau du réseau (NLA).' },
    fix: { label: 'Désactiver', desc: 'Désactive les connexions Bureau à distance entrantes.', reg: [dword(TS, 'fDenyTSConnections', 1)] },
  },
  {
    id: 'remote_assist', cat: 'Réseau', sev: 'faible', title: 'Assistance à distance',
    why: "Les arnaques au faux support technique s'appuient sur l'assistance à distance pour prendre la main sur votre PC.",
    probe: regProbe(['v', R`HKLM:\SYSTEM\CurrentControlSet\Control\Remote Assistance`, 'fAllowToGetHelp']),
    evaluate: v => v.v === 1 ? { status: 'warn', detail: 'Autorisée.' } : { status: 'ok', detail: 'Désactivée.' },
    fix: {
      label: 'Désactiver', desc: "Désactive l'Assistance à distance Windows (l'application « Assistance rapide » n'est pas concernée).",
      reg: [dword(R`HKLM:\SYSTEM\CurrentControlSet\Control\Remote Assistance`, 'fAllowToGetHelp', 0)],
    },
  },
  {
    id: 'llmnr', cat: 'Réseau', sev: 'moyenne', title: 'Résolution de noms LLMNR',
    why: "Sur un réseau partagé (hôtel, café, entreprise), LLMNR permet à un attaquant de se faire passer pour un autre PC et de récupérer votre identifiant chiffré.",
    probe: regProbe(['v', R`HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\DNSClient`, 'EnableMulticast']),
    evaluate: v => v.v === 0 ? { status: 'ok', detail: 'Désactivée.' } : { status: 'ko', detail: 'Activée (réglage par défaut de Windows).' },
    fix: { label: 'Désactiver', desc: 'Désactive la résolution de noms LLMNR (sans effet sur la navigation Internet).', reg: [dword(R`HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\DNSClient`, 'EnableMulticast', 0)] },
  },
  {
    id: 'ports', cat: 'Réseau', sev: 'moyenne', title: 'Services sensibles à l\'écoute sur le réseau',
    why: "Chaque service à l'écoute sur toutes les interfaces est une porte vers votre PC. Ceux listés ici (bureau à distance, bases de données, FTP…) sont des cibles classiques.",
    probe: R`@{ ports = @(Get-NetTCPConnection -State Listen | Where-Object { $_.LocalAddress -in '0.0.0.0', '::' } | Sort-Object LocalPort -Unique | ForEach-Object { @{ port = [int]$_.LocalPort; proc = [string](Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).ProcessName } }) }`,
    evaluate: v => {
      const risky = { 21: 'FTP', 23: 'Telnet', 1433: 'SQL Server', 3306: 'MySQL', 3389: 'Bureau à distance', 5432: 'PostgreSQL', 5900: 'VNC', 5985: 'WinRM', 5986: 'WinRM', 6379: 'Redis', 27017: 'MongoDB' };
      const all = v.ports || [];
      const bad = all.filter(p => risky[p.port]);
      if (bad.length) return { status: 'warn', detail: `À l'écoute : ${bad.map(p => `${risky[p.port]} (port ${p.port}${p.proc ? `, ${p.proc}` : ''})`).join(', ')}.` };
      return { status: 'ok', detail: `Aucun service sensible exposé (${plural(all.length, 'port')} à l'écoute au total).` };
    },
    manual: "Vérifiez que ces services sont voulus ; sinon, arrêtez-les ou désinstallez le logiciel concerné.",
  },
  {
    id: 'shares', cat: 'Réseau', sev: 'faible', admin: true, title: 'Dossiers partagés sur le réseau',
    why: 'Un dossier partagé oublié peut exposer vos fichiers à tous les appareils du réseau, y compris un objet connecté compromis.',
    probe: R`@{ partages = @(Get-SmbShare | Where-Object { $_.Name -notmatch '^(ADMIN|IPC|print|[A-Z])\$$' } | ForEach-Object { @{ nom = [string]$_.Name; chemin = [string]$_.Path } }) }`,
    evaluate: v => {
      const s = v.partages || [];
      return s.length ? { status: 'warn', detail: `Partagés : ${s.map(p => `${p.nom} (${p.chemin})`).join(', ')}.` } : { status: 'ok', detail: 'Aucun dossier partagé.' };
    },
    manual: "Retirez les partages inutiles (clic droit sur le dossier, Propriétés, Partage).",
  },

  // ───────────── Comptes ─────────────
  {
    id: 'guest', cat: 'Comptes', sev: 'elevee', title: 'Compte Invité',
    why: "Le compte Invité permet d'ouvrir une session sans mot de passe. Il doit rester désactivé.",
    probe: R`$u = Get-LocalUser | Where-Object { $_.SID.Value -like '*-501' } | Select-Object -First 1; @{ actif = [bool]$u.Enabled; nom = [string]$u.Name }`,
    evaluate: v => v.actif ? { status: 'ko', detail: `Le compte « ${v.nom} » est activé.` } : { status: 'ok', detail: 'Désactivé.' },
    fix: {
      label: 'Désactiver', desc: 'Désactive le compte Invité.',
      apply: R`$u = Get-LocalUser | Where-Object { $_.SID.Value -like '*-501' } | Select-Object -First 1; $b = @{ v = [bool]$u.Enabled }; Disable-LocalUser -SID $u.SID; $b`,
      undo: R`if ($before.v) { $u = Get-LocalUser | Where-Object { $_.SID.Value -like '*-501' } | Select-Object -First 1; Enable-LocalUser -SID $u.SID }`,
      validate: b => isBool(b.v),
    },
  },
  {
    id: 'lockout', cat: 'Comptes', sev: 'moyenne', admin: true, title: 'Verrouillage après plusieurs mots de passe erronés',
    why: "Sans limite d'essais, un attaquant (ou un programme) peut tester des milliers de mots de passe sur un compte local.",
    probe: R`
      $f = Join-Path $env:TEMP ('rempart-' + [guid]::NewGuid() + '.inf')
      secedit /export /cfg $f /areas SECURITYPOLICY /quiet | Out-Null
      if (-not (Test-Path $f)) { throw 'Accès refusé à la stratégie de sécurité.' }
      $t = Get-Content $f -Raw -Encoding Unicode; Remove-Item $f -Force
      $g = { param($k) if ($t -match "(?m)^\s*$k\s*=\s*(-?\d+)") { [int]$matches[1] } else { $null } }
      @{ seuil = (& $g 'LockoutBadCount'); longueur = (& $g 'MinimumPasswordLength') }`,
    evaluate: v => {
      const len = v.longueur != null ? ` Longueur minimale des mots de passe locaux : ${plural(v.longueur, 'caractère')}.` : '';
      if (!v.seuil) return { status: 'ko', detail: `Aucune limite d'essais.${len}` };
      if (v.seuil > 10) return { status: 'warn', detail: `Verrouillage après ${v.seuil} essais : c'est beaucoup.${len}` };
      return { status: 'ok', detail: `Verrouillage après ${v.seuil} essais.${len}` };
    },
    fix: {
      label: 'Limiter à 10 essais', desc: 'Verrouille un compte local pendant quelques minutes après 10 mots de passe erronés (les comptes Microsoft et le code PIN ont leur propre protection).',
      apply: R`$f = Join-Path $env:TEMP ('rempart-' + [guid]::NewGuid() + '.inf')
        secedit /export /cfg $f /areas SECURITYPOLICY /quiet | Out-Null
        $t = Get-Content $f -Raw -Encoding Unicode; Remove-Item $f -Force
        $b = @{ v = $(if ($t -match '(?m)^\s*LockoutBadCount\s*=\s*(\d+)') { [int]$matches[1] } else { 0 }) }
        net accounts /lockoutthreshold:10 | Out-Null
        if ($LASTEXITCODE -ne 0) { throw 'La commande net accounts a échoué.' }
        $b`,
      undo: R`net accounts /lockoutthreshold:$([int]$before.v) | Out-Null; if ($LASTEXITCODE -ne 0) { throw 'La commande net accounts a échoué.' }`,
      validate: b => isInt(b.v, 0, 999),
    },
  },
  {
    id: 'daily_admin', cat: 'Comptes', sev: 'faible', title: 'Compte utilisé au quotidien',
    why: "Utiliser un compte standard au quotidien (et un compte administrateur seulement pour installer) empêche la plupart des logiciels malveillants de s'installer en profondeur.",
    probe: R`$g = whoami /groups | Out-String; @{ admin = ($g -match 'S-1-5-32-544'); nb = $(try { @(Get-LocalGroupMember -SID S-1-5-32-544).Count } catch { $null }) }`,
    evaluate: v => v.admin
      ? { status: 'warn', detail: `Votre compte est administrateur${v.nb ? ` (${v.nb > 1 ? `${v.nb} comptes administrateurs` : 'seul compte administrateur'} sur ce PC)` : ''}.` }
      : { status: 'ok', detail: 'Vous utilisez un compte standard.' },
    manual: "Créez un second compte administrateur, puis passez votre compte habituel en « Utilisateur standard ».",
    open: 'ms-settings:otherusers',
  },
];

const SEV = { critique: 'Critique', elevee: 'Élevée', moyenne: 'Moyenne', faible: 'Faible' };

// Une sauvegarde est-elle acceptable pour annuler la correction de ce point ?
const validBackup = (c, before) => c.fix.reg ? validRegBackup(c.fix, before) : !!(c.fix.undo && c.fix.validate && c.fix.validate(before ?? {}));

module.exports = { checks, SEV, validBackup };
