import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  name: 'Anti-clickbait',
  description: 'Shows you the real title of an article before you click it on VG.no',
  version: '0.1.1',
  manifest_version: 3,
  icons: {
    '16': 'img/logo-16.png',
    '32': 'img/logo-34.png',
    '48': 'img/logo-48.png',
    '128': 'img/logo-128.png',
  },
  action: {
    default_popup: 'popup.html',
    default_icon: 'img/logo-48.png',
  },
  options_page: 'options.html',
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
      resources: ['img/logo-16.png', 'img/logo-34.png', 'img/logo-48.png', 'img/logo-128.png'],
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
