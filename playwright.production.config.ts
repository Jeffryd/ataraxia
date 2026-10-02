import { defineConfig } from '@playwright/test';
import developmentConfig from './playwright.config';
const baseURL = 'http://127.0.0.1:4173/ataraxia/';
export default defineConfig({
  ...developmentConfig,
  metadata: { staticDeployment: true },
  use: { ...developmentConfig.use, baseURL },
  webServer: {
    command: 'npm run preview -w @ataraxia/web -- --port 4173 --strictPort',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 30000,
  },
});
