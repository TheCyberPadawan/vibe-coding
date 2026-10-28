# Assistant administrateur de Vigie. Lancé une fois par session (fenêtre UAC), il ne fait que trois choses :
# créer une règle de blocage du pare-feu Windows, supprimer une règle qu'il a créée, arrêter un programme.
# Il ne parle qu'au canal nommé qu'il crée, réservé au compte de l'utilisateur, après vérification d'un jeton secret.
# Les variables $PipeName, $Token, $ClientSid et $InternetRanges sont définies par Vigie avant ce script.
$ErrorActionPreference = 'Stop'

$GROUP = 'Vigie'
# Programmes vitaux : les bloquer couperait Windows, ses mises à jour ou l'antivirus
$PROTECTED = @('system', 'svchost.exe', 'lsass.exe', 'services.exe', 'wininit.exe', 'csrss.exe', 'smss.exe', 'winlogon.exe',
  'dwm.exe', 'spoolsv.exe', 'msmpeng.exe', 'nissrv.exe', 'mpdefendercoreservice.exe', 'securityhealthservice.exe',
  'powershell.exe', 'pwsh.exe', 'vigie.exe', 'explorer.exe')
$SYS = [Environment]::GetFolderPath('System').ToLowerInvariant()

function Check-Program([string]$p) {
  if (-not $p -or $p.Length -gt 1024 -or $p -match '[*?"<>|]' -or -not [IO.Path]::IsPathRooted($p)) { throw 'Chemin de programme invalide.' }
  $full = [IO.Path]::GetFullPath($p)
  if ($full -ne $p -and $full.ToLowerInvariant() -ne $p.ToLowerInvariant()) { throw 'Chemin de programme non canonique.' }
  if ([IO.Path]::GetExtension($full).ToLowerInvariant() -ne '.exe') { throw 'Seuls les programmes .exe peuvent être visés.' }
  if (-not (Test-Path -LiteralPath $full -PathType Leaf)) { throw 'Programme introuvable.' }
  $leaf = [IO.Path]::GetFileName($full).ToLowerInvariant()
  if ($PROTECTED -contains $leaf -and ($leaf -ne 'explorer.exe' -or $full.ToLowerInvariant().StartsWith($env:SystemRoot.ToLowerInvariant()))) { throw "$leaf est un composant vital de Windows : Vigie refuse de le bloquer ou de l'arrêter." }
  return $full
}

function Do-Block($m) {
  $p = Check-Program ([string]$m.program)
  $leaf = [IO.Path]::GetFileName($p)
  $dir = [string]$m.dir; $scope = [string]$m.scope
  if ($dir -ne 'out' -and $dir -ne 'in') { throw 'Sens invalide.' }
  if ($scope -ne 'all' -and $scope -ne 'internet') { throw 'Portée invalide.' }
  if ($dir -eq 'in' -and $scope -ne 'all') { throw 'Portée invalide pour une règle entrante.' }
  $label = if ($dir -eq 'in') { 'connexions entrantes bloquées' } elseif ($scope -eq 'internet') { 'Internet bloqué, réseau local autorisé' } else { 'accès réseau sortant bloqué' }
  $name = 'Vigie-' + [guid]::NewGuid().ToString()
  $params = @{
    Name = $name; DisplayName = "Vigie · $leaf · $label"; Group = $GROUP; Program = $p; Action = 'Block'; Profile = 'Any'; Enabled = 'True'
    Direction = $(if ($dir -eq 'in') { 'Inbound' } else { 'Outbound' })
    Description = "Créée par Vigie le $(Get-Date -Format 'yyyy-MM-dd HH:mm') pour $p"
  }
  if ($scope -eq 'internet') { $params.RemoteAddress = $InternetRanges }
  New-NetFirewallRule @params | Out-Null
  return @{ name = $name }
}

function Do-Unblock($m) {
  $name = [string]$m.name
  if ($name -notmatch '^Vigie-[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$') { throw 'Nom de règle invalide.' }
  $r = Get-NetFirewallRule -Name $name -ErrorAction SilentlyContinue
  if (-not $r) { return @{ gone = $true } }
  if ($r.Group -ne $GROUP) { throw "Cette règle n'a pas été créée par Vigie." }
  Remove-NetFirewallRule -Name $name
  return @{}
}

function Do-Kill($m) {
  $p = Check-Program ([string]$m.program)
  $id = [int]$m.pid
  $proc = Get-CimInstance Win32_Process -Filter "ProcessId = $id" -ErrorAction SilentlyContinue
  # Le numéro de processus a pu être réutilisé : on vérifie que c'est bien le même programme
  if (-not $proc -or -not $proc.ExecutablePath -or $proc.ExecutablePath.ToLowerInvariant() -ne $p.ToLowerInvariant()) { throw 'Ce processus a changé ou est déjà arrêté.' }
  Stop-Process -Id $id -Force
  return @{}
}

# Canal nommé : un seul client, le compte de l'utilisateur (et cet assistant), jeton exigé en premier message
$sec = New-Object System.IO.Pipes.PipeSecurity
$sec.AddAccessRule((New-Object System.IO.Pipes.PipeAccessRule((New-Object System.Security.Principal.SecurityIdentifier($ClientSid)), 'ReadWrite', 'Allow')))
$sec.AddAccessRule((New-Object System.IO.Pipes.PipeAccessRule([System.Security.Principal.WindowsIdentity]::GetCurrent().User, 'FullControl', 'Allow')))
$pipe = New-Object System.IO.Pipes.NamedPipeServerStream($PipeName, [System.IO.Pipes.PipeDirection]::InOut, 1, [System.IO.Pipes.PipeTransmissionMode]::Byte, [System.IO.Pipes.PipeOptions]::Asynchronous, 65536, 65536, $sec)
$wait = $pipe.BeginWaitForConnection($null, $null)
if (-not $wait.AsyncWaitHandle.WaitOne(60000)) { $pipe.Dispose(); exit 2 }
$pipe.EndWaitForConnection($wait)
$utf8 = New-Object System.Text.UTF8Encoding($false)
$reader = New-Object System.IO.StreamReader($pipe, $utf8)
$writer = New-Object System.IO.StreamWriter($pipe, $utf8); $writer.AutoFlush = $true

$first = $reader.ReadLine()
if ($first -ne $Token) { $pipe.Dispose(); exit 3 }
$writer.WriteLine('{"ready":true}')

while ($pipe.IsConnected) {
  $line = $reader.ReadLine()
  if ($null -eq $line) { break }
  $id = 0
  try {
    if ($line.Length -gt 8192) { throw 'Message trop long.' }
    $m = $line | ConvertFrom-Json
    $id = [int]$m.id
    $res = switch ([string]$m.op) {
      'block' { Do-Block $m }
      'unblock' { Do-Unblock $m }
      'kill' { Do-Kill $m }
      'ping' { @{} }
      default { throw 'Commande inconnue.' }
    }
    $res.id = $id; $res.ok = $true
  } catch { $res = @{ id = $id; ok = $false; e = $_.Exception.Message } }
  $writer.WriteLine(($res | ConvertTo-Json -Compress))
}
$pipe.Dispose()
