import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./tests',fullyParallel:true,workers:3,timeout:30000,
  use:{baseURL:'http://127.0.0.1:5173',headless:true,screenshot:'only-on-failure'},
  webServer:{command:'npm run dev -- --port 5173',url:'http://127.0.0.1:5173',reuseExistingServer:!process.env.CI},
  reporter:'list',
});
