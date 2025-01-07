import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react', '@wxt-dev/i18n/module'],
  manifest: {
    permissions: [
      'tabs',
      'storage'
    ],
    default_locale: 'en',
    options_ui: {
      page: 'options/index.html',
      open_in_tab: true
    },
    background: {
      service_worker: 'background.ts'
    },
    action: {}
  }
});
