# Collecteur de Vigie (droits normaux) : une ligne « @@{json} » par instantané.
# Tables TCP/UDP de Windows (IPv4 et IPv6) avec le processus propriétaire, et chemin de chaque programme.
# Lecture seule : ce script ne modifie rien.
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8

Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Net;
using System.Runtime.InteropServices;
using System.Text;

public static class VigieNative {
  [DllImport("iphlpapi.dll")] static extern uint GetExtendedTcpTable(IntPtr t, ref int size, bool sort, int af, int cls, int r);
  [DllImport("iphlpapi.dll")] static extern uint GetExtendedUdpTable(IntPtr t, ref int size, bool sort, int af, int cls, int r);
  [DllImport("ntdll.dll")] static extern int NtQuerySystemInformation(int cls, ref ProcIdInfo info, int len, out int ret);
  [DllImport("kernel32.dll", CharSet = CharSet.Unicode)] static extern uint QueryDosDevice(string dev, StringBuilder target, int max);

  [StructLayout(LayoutKind.Sequential)] struct UStr { public ushort Length; public ushort MaximumLength; public IntPtr Buffer; }
  [StructLayout(LayoutKind.Sequential)] struct ProcIdInfo { public IntPtr ProcessId; public UStr ImageName; }

  static string Port(uint p) { return (((p & 0xFF) << 8) | ((p >> 8) & 0xFF)).ToString(); }
  static string Ip4(uint a) { return new IPAddress(a).ToString(); }
  static string Ip6(IntPtr p) { var b = new byte[16]; Marshal.Copy(p, b, 0, 16); return new IPAddress(b).ToString(); }
  static string Esc(string s) {
    if (s == null) return "null";
    var sb = new StringBuilder("\"");
    foreach (var c in s) {
      if (c == '"' || c == '\\') { sb.Append('\\').Append(c); }
      else if (c < 0x20) { sb.Append("\\u").Append(((int)c).ToString("x4")); }
      else sb.Append(c);
    }
    return sb.Append('"').ToString();
  }

  delegate uint Getter(IntPtr t, ref int size, bool sort, int af, int cls, int r);
  static void Table(Getter get, int af, int cls, Action<IntPtr, int> each) {
    int size = 0;
    get(IntPtr.Zero, ref size, false, af, cls, 0);
    for (int tries = 0; tries < 4; tries++) {
      IntPtr buf = Marshal.AllocHGlobal(size);
      try {
        uint err = get(buf, ref size, false, af, cls, 0);
        if (err == 122) continue;                      // la table a grossi entre les deux appels
        if (err != 0) return;
        int n = Marshal.ReadInt32(buf);
        each(buf, n);
        return;
      } finally { Marshal.FreeHGlobal(buf); }
    }
  }

  static Dictionary<string, string> drives;
  static string ToDos(string nt) {
    if (drives == null) {
      drives = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
      foreach (var d in Environment.GetLogicalDrives()) {
        var name = d.TrimEnd('\\'); var sb = new StringBuilder(512);
        if (QueryDosDevice(name, sb, 512) > 0) drives[sb.ToString()] = name;
      }
    }
    foreach (var kv in drives) if (nt.StartsWith(kv.Key + "\\", StringComparison.OrdinalIgnoreCase)) return kv.Value + nt.Substring(kv.Key.Length);
    return nt;
  }
  // Chemin de l'exécutable d'un processus, sans avoir à l'ouvrir (fonctionne aussi pour les processus système)
  public static string ImagePath(int pid) {
    if (pid <= 4) return null;
    IntPtr buf = Marshal.AllocHGlobal(4096);
    try {
      var info = new ProcIdInfo { ProcessId = (IntPtr)pid, ImageName = new UStr { Length = 0, MaximumLength = 4096, Buffer = buf } };
      int ret;
      if (NtQuerySystemInformation(0x58, ref info, Marshal.SizeOf(typeof(ProcIdInfo)), out ret) != 0) return null;
      return ToDos(Marshal.PtrToStringUni(info.ImageName.Buffer, info.ImageName.Length / 2));
    } finally { Marshal.FreeHGlobal(buf); }
  }

  public static string Snapshot() {
    var sb = new StringBuilder("{\"tcp\":[");
    var pids = new HashSet<int>();
    bool first = true;
    Action<string, string, string, string, int, int> tcp = (la, lp, ra, rp, st, pid) => {
      if (!first) sb.Append(','); first = false; pids.Add(pid);
      sb.Append('[').Append(Esc(la)).Append(',').Append(lp).Append(',').Append(Esc(ra)).Append(',').Append(rp).Append(',').Append(st).Append(',').Append(pid).Append(']');
    };
    // MIB_TCPROW_OWNER_PID : état, adresse locale, port local, adresse distante, port distant, PID (6 × 4 octets)
    Table(GetExtendedTcpTable, 2, 5, (buf, n) => { for (int i = 0; i < n; i++) { IntPtr r = buf + 4 + i * 24;
      tcp(Ip4((uint)Marshal.ReadInt32(r, 4)), Port((uint)Marshal.ReadInt32(r, 8)), Ip4((uint)Marshal.ReadInt32(r, 12)), Port((uint)Marshal.ReadInt32(r, 16)), Marshal.ReadInt32(r, 0), Marshal.ReadInt32(r, 20)); } });
    // MIB_TCP6ROW_OWNER_PID : adresse locale (16), portée, port, adresse distante (16), portée, port, état, PID
    Table(GetExtendedTcpTable, 23, 5, (buf, n) => { for (int i = 0; i < n; i++) { IntPtr r = buf + 4 + i * 56;
      tcp(Ip6(r), Port((uint)Marshal.ReadInt32(r, 20)), Ip6(r + 24), Port((uint)Marshal.ReadInt32(r, 44)), Marshal.ReadInt32(r, 48), Marshal.ReadInt32(r, 52)); } });
    sb.Append("],\"udp\":["); first = true;
    Action<string, string, int> udp = (la, lp, pid) => {
      if (!first) sb.Append(','); first = false; pids.Add(pid);
      sb.Append('[').Append(Esc(la)).Append(',').Append(lp).Append(',').Append(pid).Append(']');
    };
    // MIB_UDPROW_OWNER_PID : adresse, port, PID ; MIB_UDP6ROW_OWNER_PID : adresse (16), portée, port, PID
    Table(GetExtendedUdpTable, 2, 1, (buf, n) => { for (int i = 0; i < n; i++) { IntPtr r = buf + 4 + i * 12;
      udp(Ip4((uint)Marshal.ReadInt32(r, 0)), Port((uint)Marshal.ReadInt32(r, 4)), Marshal.ReadInt32(r, 8)); } });
    Table(GetExtendedUdpTable, 23, 1, (buf, n) => { for (int i = 0; i < n; i++) { IntPtr r = buf + 4 + i * 28;
      udp(Ip6(r), Port((uint)Marshal.ReadInt32(r, 20)), Marshal.ReadInt32(r, 24)); } });
    sb.Append("],\"proc\":{"); first = true;
    foreach (var pid in pids) {
      if (!first) sb.Append(','); first = false;
      sb.Append('"').Append(pid).Append("\":").Append(Esc(ImagePath(pid)));
    }
    return sb.Append("}}").ToString();
  }
}
'@

$interval = [int]$env:VIGIE_INTERVAL; if ($interval -lt 500) { $interval = 1000 }
$svcAt = [DateTime]::MinValue
while ($true) {
  $now = [DateTime]::UtcNow
  $line = '@@{"t":"snap","d":' + [VigieNative]::Snapshot() + '}'
  [Console]::Out.WriteLine($line)
  # Services hébergés par chaque processus (svchost…), toutes les 30 s
  if (($now - $svcAt).TotalSeconds -ge 30) {
    $svcAt = $now
    try {
      $map = @{}
      foreach ($s in Get-CimInstance Win32_Service -Filter 'ProcessId > 0' -ErrorAction Stop) {
        $k = [string]$s.ProcessId; if (-not $map[$k]) { $map[$k] = @() }; $map[$k] += [string]$s.DisplayName
      }
      [Console]::Out.WriteLine('@@' + (@{ t = 'svc'; d = $map } | ConvertTo-Json -Depth 4 -Compress))
    } catch {}
  }
  Start-Sleep -Milliseconds $interval
}
