import clickbaitListener from './clickbait'
import { getEyesores, storeEyesore } from './eyesore'
import browser from 'webextension-polyfill'

browser.runtime.onMessage.addListener(
  (message: MessageEvent, _sender, sendResponse: (response: unknown) => void) => {
    if (message.type === 'eyesorerequest') {
      getEyesores().then((response) => sendResponse(response))
    } else if (message.type === 'clickbait') {
      clickbaitListener(message).then((response) => sendResponse(response))
    }

    return true
  },
)

browser.runtime.onInstalled.addListener(() => {
  if (browser.contextMenus?.create) {
    browser.contextMenus.create({
      id: 'clickbait',
      title: 'Hide article forever',
      contexts: ['link'],
      documentUrlPatterns: ['https://www.vg.no/*'],
    })
  }
  browser.runtime.openOptionsPage()
})

if (browser.contextMenus?.onClicked) {
  browser.contextMenus.onClicked.addListener(({ linkUrl }) => linkUrl && storeEyesore(linkUrl))
}

browser.action.onClicked.addListener((tab) => {
  if (!tab.id) return
  browser.tabs.sendMessage(tab.id, { type: 'reveal-viewport' })
})
