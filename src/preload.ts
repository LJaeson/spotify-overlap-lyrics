// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  onLyric: (callback: (text: string) => void) => ipcRenderer.on('from-python', (_event, value) => callback(value)),

  setWindowSize: (width: number, height: number) => ipcRenderer.send('resize-window', { width, height }),

  showContextMenu: () => ipcRenderer.send('show-context-menu')

});