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
    default_locale: 'en'
  }
});
