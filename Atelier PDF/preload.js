// Pont entre la page et Windows : fichiers ouverts depuis l'Explorateur, boîte "Enregistrer sous".
const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  onOpenFile: cb => ipcRenderer.on('open-file', (_e, f) => cb(f)),
  pickSave: (name, dir, ext) => ipcRenderer.invoke('pick-save', { name, dir, ext }),
  writeFile: bytes => ipcRenderer.invoke('write-file', bytes),
  pickDir: dir => ipcRenderer.invoke('pick-dir', dir),
  writeInDir: (name, bytes) => ipcRenderer.invoke('write-in-dir', name, bytes),
  print: pages => ipcRenderer.invoke('print', pages),
  dirOf: file => {
    try { return (webUtils.getPathForFile(file) || '').replace(/[\\/][^\\/]*$/, ''); } catch { return ''; }
  },
});
