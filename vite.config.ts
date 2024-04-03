import { defineConfig } from 'vite'

import webExtension, { readJsonFile } from 'vite-plugin-web-extension'
import { Manifest } from 'webextension-polyfill'
import { LogoSizes, HostPermissions } from './src/constants'
const icons: Record<string, string> = Object.fromEntries(
  LogoSizes.map((size) => [size.toString(), `img/logo-${size}.png`]),
)
const resources = Object.values(icons)

const target = process.env.TARGET || 'chrome'

const [mainPermission, ...optionalPermissions] = HostPermissions

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
          web_accessible_resources: [
            {
              resources,
              matches: [],
            },
          ],
          version: pkg.version,
          icons,
          '{{firefox}}.host_permissions': [mainPermission, ...optionalPermissions],
          '{{chrome}}.host_permissions': [mainPermission],
          '{{chrome}}.optional_host_permissions': [...optionalPermissions],
        }
      },
    }),
  ],
})
