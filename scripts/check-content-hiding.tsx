import assert from 'node:assert/strict'
import React from 'react'
import { act } from 'react-dom/test-utils'
import { createRoot } from 'react-dom/client'
import '@emotion/react'
import { parseHTML } from 'linkedom'
import { StorageKeys } from '../src/constants'

const { window } = parseHTML('<html><body><div id="root"></div></body></html>')
const listeners = new Set<(changes: object, areaName: string) => void>()
const stored: Record<string, unknown> = {}
Object.assign(globalThis, {
  window,
  document: window.document,
  chrome: { runtime: { id: 'test' } },
  IS_REACT_ACT_ENVIRONMENT: true,
  browser: {
    runtime: {
      id: 'test',
      sendMessage: async () => [],
      onMessage: { addListener() {}, removeListener() {} },
    },
    storage: {
      local: { get: async () => ({ ...stored }) },
      onChanged: {
        addListener: (listener: (changes: object, areaName: string) => void) =>
          listeners.add(listener),
        removeListener: (listener: (changes: object, areaName: string) => void) =>
          listeners.delete(listener),
      },
    },
  },
})

const { EyesoreHider } = await import('../src/content/EyesoreHider')
const root = createRoot(document.getElementById('root')!)
const selector = "article:has(svg[aria-label='VG+'])"
const hidingEnabled = () => document.body.textContent!.includes(selector)
const adSelector = "[name='vg-partnerstudio']"
const adHidingEnabled = () => document.body.textContent!.includes(adSelector)
const changeSetting = async (
  value: unknown,
  areaName = 'local',
  key: string = StorageKeys.hideVgPlus,
) => {
  await act(async () => {
    listeners.forEach((listener) => listener({ [key]: { newValue: value } }, areaName))
  })
}

await act(async () => root.render(<EyesoreHider />))
assert.equal(hidingEnabled(), false, 'VG+ hiding defaults to off')
assert.equal(adHidingEnabled(), false, 'ad hiding defaults to off')
await changeSetting(true, 'sync', StorageKeys.hideAds)
assert.equal(adHidingEnabled(), false, 'ad hiding ignores unrelated storage areas')
await changeSetting(true, 'sync')
assert.equal(hidingEnabled(), false, 'unrelated storage areas are ignored')
await changeSetting(true)
assert.equal(hidingEnabled(), true, 'enabling the setting installs the hiding rule')
assert.equal(adHidingEnabled(), false, 'enabling VG+ hiding does not hide ads')
await changeSetting(true, 'local', StorageKeys.hideAds)
assert.equal(adHidingEnabled(), true, 'enabling ad hiding installs its rule')
assert.equal(hidingEnabled(), true, 'enabling ad hiding leaves VG+ hiding enabled')

document.body.insertAdjacentHTML(
  'beforeend',
  '<article id="plus"><svg aria-label="VG+"></svg></article>' +
    '<article id="free"><svg aria-label="VG"></svg></article>' +
    '<article id="other"><span aria-label="VG+"></span></article>' +
    '<section id="ad" name="vg-partnerstudio"></section>' +
    '<section id="not-ad" name="other"></section>',
)
assert.deepEqual(
  Array.from(document.querySelectorAll(selector), (article) => article.id),
  ['plus'],
  'the rule matches newly added VG+ articles, not other articles or non-SVG labels',
)
assert.deepEqual(
  Array.from(document.querySelectorAll(adSelector), (element) => element.id),
  ['ad'],
  'the ad rule matches newly added partnerstudio content only',
)
await changeSetting(false)
assert.equal(hidingEnabled(), false, 'disabling the setting removes the hiding rule')
assert.equal(adHidingEnabled(), true, 'disabling VG+ hiding leaves ad hiding enabled')
await changeSetting(false, 'local', StorageKeys.hideAds)
assert.equal(adHidingEnabled(), false, 'disabling ad hiding removes its rule')
await act(async () => root.unmount())
assert.equal(listeners.size, 0, 'the storage listener is cleaned up')

stored[StorageKeys.hideVgPlus] = true
stored[StorageKeys.hideAds] = true
const restoredRoot = createRoot(document.getElementById('root')!)
await act(async () => restoredRoot.render(<EyesoreHider />))
assert.equal(hidingEnabled(), true, 'the saved setting is restored on load')
assert.equal(adHidingEnabled(), true, 'the saved ad setting is restored on load')
await act(async () => restoredRoot.unmount())
console.log('Content hiding checks passed')
