import { defineManifest } from '@crxjs/vite-plugin'
import { version } from '../package.json'
import { LogoSizes } from './constants'

const icons: Record<string, string> = Object.fromEntries(
  LogoSizes.map((size) => [size.toString(), `img/logo-${size}.png`]),
)
const resources = Object.values(icons)

export default defineManifest({
  name: 'Anti-clickbait',
  description: 'Shows you the real title of an article before you click it on VG.no',
  version,
  manifest_version: 3,
  icons,
  // action: {
  //   default_popup: 'pages/popup.html',
  //   default_icon: 'img/logo-256.png',
  // },
  // options_page: 'pages/options.html',
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['https://www.vg.no/*'],
      js: ['src/content/index.tsx'],
    },
  ],
  web_accessible_resources: [
    {
      resources,
      matches: [],
    },
  ],
  permissions: [],
  host_permissions: [
    'https://*.vg.no/*',
    'https://*.e24.no/*',
    'https://www.minmote.no/*',
    'https://www.tek.no/*',
    'https://www.godt.no/*',
  ],
})
