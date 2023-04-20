import { isUrlRequest, SuccessMessage } from '../types'
import type { ServiceWorkerResponse } from '../types'
import { parseHTML } from 'linkedom'

const tagFinders: Omit<Record<keyof SuccessMessage, string[]>, 'success'> = {
  heading: ['[data-test-tag="headline"]', 'h1'],
  subheading: ['[data-test-tag="lead-text"]', 'h2'],
  byline: ['[data-test-tag="byline"]'],
  ingress: ['[data-test-tag="byline"] ~ p'],
}

const extractInformation = async (response: Response): Promise<ServiceWorkerResponse> => {
  const domString = await response.text()
  try {
    const { document } = parseHTML(domString)
    const finder = (tag: keyof typeof tagFinders): string =>
      tagFinders[tag].reduce((acc, selector) => {
        if (acc) return acc
        return document.querySelector(selector)?.textContent ?? ''
      }, '')

    return {
      success: true,
      heading: finder('heading'),
      byline: finder('byline'),
      ingress: finder('ingress'),
      subheading: finder('subheading'),
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: 'Crashed parsing dom' + error,
    }
  }
}

const listener = async (message: MessageEvent): Promise<ServiceWorkerResponse> => {
  if (isUrlRequest(message)) {
    const { checkIfUrlExists: url } = message
    try {
      const response = await fetch(url)
      if (response.status === 200) {
        return await extractInformation(response)
      } else {
        return { success: false, error: 'Not 200' }
      }
    } catch (error: unknown) {
      return { success: false, error: error as string }
    }
  }
  return { success: false, error: 'Fell through handler with no error raised' }
}

chrome.runtime.onMessage.addListener(
  (message, _sender, sendResponse: (response: ServiceWorkerResponse) => void) => {
    listener(message).then((response) => sendResponse(response))
    return true
  },
)
