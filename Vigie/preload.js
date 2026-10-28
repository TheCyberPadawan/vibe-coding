// Pont entre la page et le processus principal : clés de programme et noms d'action seulement.
const { contextBridge, ipcRenderer } = require('electron');

const on = ch => cb => ipcRenderer.on(ch, (_e, v) => cb(v));
contextBridge.exposeInMainWorld('vigie', {
  onUpdate: on('update'), onIcons: on('icons'), onHelper: on('helper'), onJournal: on('journal'),
  snapshot: () => ipcRenderer.invoke('snapshot'),
  details: key => ipcRenderer.invoke('details', key),
  act: (key, action) => ipcRenderer.invoke('act', key, action),
  showInFolder: key => ipcRenderer.invoke('show-in-folder', key),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setSettings: s => ipcRenderer.invoke('set-settings', s),
  journal: () => ipcRenderer.invoke('journal'),
});
