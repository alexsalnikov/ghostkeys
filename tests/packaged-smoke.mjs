import { _electron } from '@playwright/test';
import path from 'node:path';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

await mkdir('screenshots',{recursive:true});
const app=await _electron.launch({executablePath:path.resolve('release/linux-unpacked/ghostkeys'),args:[],env:{...process.env,ELECTRON_RUN_AS_NODE:undefined}});
try {
  const page=await app.firstWindow();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.getByRole('textbox',{name:'Vim practice editor'}).waitFor();
  assert.ok(page.url().startsWith('file:'));
  assert.equal(await page.evaluate(()=>typeof window.require),'undefined');
  const prefs=await app.evaluate(({BrowserWindow})=>{
    const p=BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences();
    return {sandbox:p.sandbox,contextIsolation:p.contextIsolation,nodeIntegration:p.nodeIntegration};
  });
  assert.deepEqual(prefs,{sandbox:true,contextIsolation:true,nodeIntegration:false});
  // Capture the installed app without changing the learner's saved progress.
  await page.screenshot({path:'screenshots/ghostkeys.png',fullPage:true});
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({packagedApp:'passed',title:await page.title(),offlineFileLoad:true,security:prefs,screenshot:'screenshots/ghostkeys.png'}));
} finally { await app.close(); }
