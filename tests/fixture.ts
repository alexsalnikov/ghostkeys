import { test as base, _electron } from '@playwright/test';
import path from 'node:path';
export const test=base.extend({
  page:async({},use)=>{
    const app=await _electron.launch({args:[path.resolve('tests/electron-harness.cjs')],env:{...process.env,ELECTRON_RUN_AS_NODE:undefined}});
    const page=await app.firstWindow();
    await use(page);
    await app.close();
  },
});
