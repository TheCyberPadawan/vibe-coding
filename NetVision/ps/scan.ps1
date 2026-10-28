# Scanner de NetVision (droits normaux, lecture seule du réseau).
# Découverte des appareils du sous-réseau : ping + ARP (SendARP, fiable même si le ping est bloqué) + sonde de ports.
# Émet une ligne « @@{json} » par événement : meta, progress, host, done, error.
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8

Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

public static class NetScan {
  [DllImport("iphlpapi.dll", ExactSpelling = true)]
  static extern int SendARP(uint destIP, uint srcIP, byte[] macAddr, ref uint len);

  // Ports testés sur un appareil présent, avec le service correspondant côté interface
  static readonly int[] PORTS = { 21, 22, 23, 53, 80, 135, 139, 443, 445, 515, 548, 554, 631, 1883, 2049, 3389, 5000, 5357, 7000, 8008, 8009, 8080, 8443, 9100, 32400, 49152, 62078 };
  // Ports qui servent aussi à repérer un appareil qui ne répond pas au ping
  static readonly int[] DISCOVERY = { 80, 443, 445, 22, 139, 8009, 62078, 5357, 9100, 554 };
  static readonly object cerr = new object();

  static void Emit(string s) { lock (cerr) { Console.Out.WriteLine("@@" + s); } }
  static string Esc(string s) {
    if (s == null) return "null";
    var sb = new StringBuilder("\"");
    foreach (var c in s) { if (c == '"' || c == '\\') sb.Append('\\').Append(c); else if (c < 0x20) sb.Append("\\u").Append(((int)c).ToString("x4")); else sb.Append(c); }
    return sb.Append('"').ToString();
  }

  static uint ToUint(IPAddress a) { var b = a.GetAddressBytes(); return ((uint)b[0] << 24) | ((uint)b[1] << 16) | ((uint)b[2] << 8) | b[3]; }
  static string FromUint(uint v) { return ((v >> 24) & 255) + "." + ((v >> 16) & 255) + "." + ((v >> 8) & 255) + "." + (v & 255); }
  static uint ToNet(uint v) { return ((v & 255) << 24) | (((v >> 8) & 255) << 16) | (((v >> 16) & 255) << 8) | ((v >> 24) & 255); }

  public static string NetworkAddress(string ip, int prefix) {
    if (prefix < 22) prefix = 22;
    uint mask = prefix >= 32 ? 0xFFFFFFFFu : (0xFFFFFFFFu << (32 - prefix));
    return FromUint(ToUint(IPAddress.Parse(ip)) & mask);
  }

  public static string[] Hosts(string ip, int prefix, int cap) {
    if (prefix < 22) prefix = 22;                 // borne : on ne balaie jamais plus de ~1024 adresses
    int hostBits = 32 - prefix;
    uint mask = hostBits >= 32 ? 0 : (0xFFFFFFFFu << hostBits);
    uint net = ToUint(IPAddress.Parse(ip)) & mask;
    uint size = hostBits >= 32 ? 0u : (1u << hostBits);
    var list = new List<string>();
    for (uint i = 1; i < size - 1 && list.Count < cap; i++) list.Add(FromUint(net + i));
    return list.ToArray();
  }

  static string Mac(string ip) {
    try {
      byte[] mac = new byte[8]; uint len = 8;
      if (SendARP(ToNet(ToUint(IPAddress.Parse(ip))), 0, mac, ref len) == 0 && len >= 6) {
        var parts = new string[6];
        for (int i = 0; i < 6; i++) parts[i] = mac[i].ToString("X2");
        var s = string.Join("-", parts);
        return s == "00-00-00-00-00-00" ? null : s;
      }
    } catch { }
    return null;
  }

  static async Task<List<int>> Probe(string ip, int[] ports, int timeout) {
    var open = new List<int>();
    var tasks = new List<Task>();
    foreach (int p in ports) {
      int port = p;
      tasks.Add(Task.Run(async () => {
        try {
          using (var c = new TcpClient()) {
            var t = c.ConnectAsync(ip, port);
            if (await Task.WhenAny(t, Task.Delay(timeout)) == t && !t.IsFaulted && c.Connected) { lock (open) open.Add(port); }
          }
        } catch { }
      }));
    }
    await Task.WhenAll(tasks);
    open.Sort();
    return open;
  }

  static async Task<string> Name(string ip) {
    try {
      var t = Dns.GetHostEntryAsync(ip);
      if (await Task.WhenAny(t, Task.Delay(1200)) == t && !t.IsFaulted) {
        var h = t.Result.HostName;
        if (!string.IsNullOrEmpty(h) && h != ip) return h;
      }
    } catch { }
    return null;
  }

  public static void Scan(string[] ips, string self, int pingTimeout, int portTimeout) {
    int done = 0, total = ips.Length;
    var sem = new SemaphoreSlim(96);
    var tasks = new List<Task>();
    foreach (var ipx in ips) {
      string ip = ipx;
      tasks.Add(Task.Run(async () => {
        await sem.WaitAsync();
        try {
          long rtt = -1; bool alive = false;
          try { using (var png = new Ping()) { var r = await png.SendPingAsync(ip, pingTimeout); if (r.Status == IPStatus.Success) { alive = true; rtt = r.RoundtripTime; } } } catch { }
          var disc = await Probe(ip, DISCOVERY, portTimeout);
          string mac = (alive || disc.Count > 0) ? Mac(ip) : null;
          bool present = alive || disc.Count > 0 || mac != null;
          if (present) {
            var ports = await Probe(ip, PORTS, portTimeout);
            string name = await Name(ip);
            var sb = new StringBuilder("{");
            sb.Append("\"ip\":").Append(Esc(ip));
            sb.Append(",\"mac\":").Append(Esc(mac));
            sb.Append(",\"name\":").Append(Esc(name));
            sb.Append(",\"rtt\":").Append(rtt);
            sb.Append(",\"alive\":").Append(alive ? "true" : "false");
            sb.Append(",\"self\":").Append(ip == self ? "true" : "false");
            sb.Append(",\"ports\":[").Append(string.Join(",", ports)).Append("]}");
            Emit("{\"t\":\"host\",\"d\":" + sb + "}");
          }
        } finally {
          sem.Release();
          int d = Interlocked.Increment(ref done);
          if (d % 16 == 0 || d == total) Emit("{\"t\":\"progress\",\"done\":" + d + ",\"total\":" + total + "}");
        }
      }));
    }
    Task.WhenAll(tasks).Wait();
    Emit("{\"t\":\"done\"}");
  }
}
'@

$cfg = Get-NetIPConfiguration -ErrorAction SilentlyContinue | Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq 'Up' } | Select-Object -First 1
if (-not $cfg) {
  [Console]::Out.WriteLine('@@{"t":"error","e":"Aucune connexion réseau active trouvée."}')
  return
}
$ip = [string]$cfg.IPv4Address.IPAddress
$prefix = [int]$cfg.IPv4Address.PrefixLength
$gw = [string]$cfg.IPv4DefaultGateway.NextHop
$iface = [string]$cfg.InterfaceAlias
$ips = [NetScan]::Hosts($ip, $prefix, 1024)
$net = [NetScan]::NetworkAddress($ip, $prefix)
$pfxShown = [Math]::Max($prefix, 22)

$meta = @{ t = 'meta'; self = $ip; prefix = $pfxShown; gateway = $gw; iface = $iface; network = $net; total = $ips.Count } | ConvertTo-Json -Compress
[Console]::Out.WriteLine('@@' + $meta)
[NetScan]::Scan($ips, $ip, 1000, 500)
