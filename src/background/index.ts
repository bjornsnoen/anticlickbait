import { IPartialNewsArticle, isUrlRequest, NewsArticleSchema, SuccessMessage } from '../types'
import type { ServiceWorkerResponse } from '../types'
import { parseHTML } from 'linkedom'

const tagFinders: Omit<Record<keyof SuccessMessage, string[]>, 'success'> = {
  heading: ['[data-test-tag="headline"]', 'h1'],
  subheading: ['[data-test-tag="lead-text"]', '.test__lead-text', 'h2'],
  byline: ['[data-test-tag="byline:authors"]', '[data-test-tag="byline"]', '.test__author-byline'],
  ingress: ['[data-test-tag="byline"] ~ p'],
}

const getJsonLdData = (
  document: ReturnType<typeof parseHTML>['document'],
): IPartialNewsArticle | undefined => {
  const jsonLdData = document.querySelectorAll('script[type="application/ld+json"]')
  if (jsonLdData) {
    for (const jsonLd of jsonLdData) {
      const schemas = JSON.parse(jsonLd.textContent ?? '[]')
      if (Array.isArray(schemas)) {
        for (const schema of schemas) {
          try {
            return NewsArticleSchema.parse(schema)
          } catch (error: unknown) {
            continue
          }
        }
      } else {
        try {
          return NewsArticleSchema.parse(schemas)
        } catch (error: unknown) {
          continue
        }
      }
    }
  }
  return undefined
}

const getServiceWorkerResponseFromLdData = (
  IPartialNewsArticle: IPartialNewsArticle,
): SuccessMessage => {
  return {
    success: true,
    heading: IPartialNewsArticle.headline,
    subheading: IPartialNewsArticle.description,
    byline: IPartialNewsArticle.author?.map((author) => author.name).join(', '),
  }
}

const extractInformation = async (response: Response): Promise<ServiceWorkerResponse> => {
  const domString = await response.text()
  try {
    const { document } = parseHTML(domString)
    const partialNewsArticle = getJsonLdData(document)
    const finder = (tag: keyof typeof tagFinders): string =>
      tagFinders[tag].reduce((acc, selector) => {
        if (acc) return acc

        const element = document.querySelector(selector) as HTMLElement | null
        if (element?.tagName === 'UL') {
          return Array.from(element.querySelectorAll('li'))
            .map((li) => li.textContent)
            .join(', ')
        }
        return element?.textContent ?? ''
      }, '')

    const bestGuessesFromDocument: SuccessMessage = {
      success: true,
      heading: finder('heading'),
      byline: finder('byline'),
      ingress: finder('ingress'),
      subheading: finder('subheading'),
    }
    return {
      ...bestGuessesFromDocument,
      ...(partialNewsArticle ? getServiceWorkerResponseFromLdData(partialNewsArticle) : {}),
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
