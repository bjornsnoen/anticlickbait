import clickbaitListener from './clickbait'
import { getEyesores, storeEyesore } from './eyesore'
import browser from 'webextension-polyfill'

// https://bugzilla.mozilla.org/show_bug.cgi?id=1771328
// This should really only run onInstalled, but it doesn't work in Firefox for some reason
// So we run it every time the extension is loaded
browser.contextMenus.create({
  id: 'clickbait',
  title: 'Hide article forever',
  contexts: ['link'],
  documentUrlPatterns: ['https://www.vg.no/*'],
})

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
  browser.contextMenus.create({
    id: 'clickbait',
    title: 'Hide article forever',
    contexts: ['link'],
    documentUrlPatterns: ['https://www.vg.no/*'],
  })
  browser.runtime.openOptionsPage()
})

browser.contextMenus.onClicked.addListener(({ linkUrl }) => linkUrl && storeEyesore(linkUrl))
