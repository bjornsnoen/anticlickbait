import { defineConfig } from 'vite'

import webExtension, { readJsonFile } from 'vite-plugin-web-extension'
import { Manifest } from 'webextension-polyfill'
import { LogoSizes } from './src/constants'
const icons: Record<string, string> = Object.fromEntries(
  LogoSizes.map((size) => [size.toString(), `img/logo-${size}.png`]),
)
const resources = Object.values(icons)

const target = process.env.TARGET || 'chrome'

export default defineConfig({
  plugins: [
    webExtension({
      browser: target,
      webExtConfig: {
        startUrl: 'https://www.vg.no/',
        firefox: 'firefoxdeveloperedition',
      },
      manifest: () => {
        // Use `readJsonFile` instead of import/require to avoid caching during rebuild.
        const pkg = readJsonFile('package.json')
        const template: Manifest.WebExtensionManifest = readJsonFile('manifest.json')
        return {
          ...template,
          // action: {
          //   default_popup: 'pages/popup.html',
          //   default_icon: 'img/logo-256.png',
          // },
          // options_page: 'pages/options.html',
          web_accessible_resources: [
            {
              resources,
              matches: [],
            },
          ],
          version: pkg.version,
          icons,
        }
      },
    }),
  ],
})
