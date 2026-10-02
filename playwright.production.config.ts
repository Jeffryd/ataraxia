import { defineConfig } from '@playwright/test';
import developmentConfig from './playwright.config';
const baseURL = `http://127.0.0.1:${process.env.API_PORT ?? '3001'}`;
export default defineConfig({
  ...developmentConfig,
  use: { ...developmentConfig.use, baseURL },
  webServer: {
    command: 'npm start',
    url: `${baseURL}/api/health`,
    reuseExistingServer: false,
    timeout: 30000,
  },
});
