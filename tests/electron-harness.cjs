const { app, BrowserWindow } = require('electron');
const { mkdtempSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
app.setPath('userData', mkdtempSync(join(tmpdir(), 'ghostkeys-test-')));
app.whenReady().then(() => {
  const window = new BrowserWindow({ width: 1360, height: 980, show: false, webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, backgroundThrottling: false, offscreen: true } });
  window.loadURL('about:blank');
});
