// Pont entre la page et le processus principal : uniquement des identifiants de vérification.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('rempart', {
  getChecks: () => ipcRenderer.invoke('get-checks'),
  audit: () => ipcRenderer.invoke('audit'),
  onResult: cb => ipcRenderer.on('audit-result', (_e, r) => cb(r)),
  fix: id => ipcRenderer.invoke('fix', id),
  undo: id => ipcRenderer.invoke('undo', id),
  openSetting: id => ipcRenderer.invoke('open-setting', id),
  restorePoint: () => ipcRenderer.invoke('restore-point'),
  relaunchAdmin: () => ipcRenderer.invoke('relaunch-admin'),
  exportPdf: html => ipcRenderer.invoke('export-pdf', html),
});
