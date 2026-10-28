// Pont entre la page et le processus principal : déclencher un scan, renommer/oublier un appareil, ouvrir son interface web.
const { contextBridge, ipcRenderer } = require('electron');

const on = ch => cb => ipcRenderer.on(ch, (_e, v) => cb(v));
contextBridge.exposeInMainWorld('netvision', {
  onScanStart: on('scan-start'), onMeta: on('meta'), onProgress: on('progress'), onHost: on('host'),
  onScanDone: on('scan-done'), onScanError: on('scan-error'),
  scan: () => ipcRenderer.invoke('scan'),
  snapshot: () => ipcRenderer.invoke('snapshot'),
  rename: (key, label) => ipcRenderer.invoke('rename', key, label),
  forget: key => ipcRenderer.invoke('forget', key),
  openHost: (key, scheme) => ipcRenderer.invoke('open-host', key, scheme),
});
