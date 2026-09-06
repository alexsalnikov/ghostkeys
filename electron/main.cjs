const { app, BrowserWindow, Menu } = require('electron');
const path = require('node:path');

// A stable location keeps progress shared between development and packaged builds.
app.setName('GhostKeys');
app.setPath('userData', path.join(app.getPath('appData'), 'GhostKeys'));
const acquired = app.requestSingleInstanceLock();
let window;
function createWindow() {
  window = new BrowserWindow({
    width: 1320, height: 900, minWidth: 880, minHeight: 650,
    title: 'GhostKeys', backgroundColor: '#121018',
    icon: path.join(__dirname, '../dist/ghost.png'),
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true },
  });
  Menu.setApplicationMenu(null);
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', event => event.preventDefault());
  window.webContents.on('will-attach-webview', event => event.preventDefault());
  window.loadFile(path.join(__dirname, '../dist/index.html'));
}
if (!acquired) app.quit();
else {
  app.on('second-instance', () => { if (window) { if (window.isMinimized()) window.restore(); window.focus(); } });
  app.whenReady().then(createWindow);
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
}
