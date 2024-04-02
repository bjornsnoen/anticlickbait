import { isUrlRequest, ldParser, SuccessMessage } from '../types'
import type { ServiceWorkerResponse } from '../types'
import { parseHTML } from 'linkedom'

const tagFinders: Omit<Record<keyof SuccessMessage, string[]>, 'success'> = {
  heading: ['[data-test-tag="headline"]', 'h1'],
  subheading: ['[data-test-tag="lead-text"]', '.test__lead-text', 'meta[name="description"]', 'h2'],
  byline: ['[data-test-tag="byline:authors"]', '[data-test-tag="byline"]', '.test__author-byline'],
  ingress: ['[data-test-tag="byline"] ~ p'],
}

const getJsonLdData = (
  document: ReturnType<typeof parseHTML>['document'],
): SuccessMessage | undefined => {
  const jsonLdData = document.querySelectorAll('script[type="application/ld+json"]')
  if (jsonLdData) {
    for (const jsonLd of jsonLdData) {
      const schemas = JSON.parse(jsonLd.textContent ?? '[]')
      if (Array.isArray(schemas)) {
        for (const schema of schemas) {
          try {
            return { ...ldParser(schema), success: true }
          } catch (error: unknown) {
            continue
          }
        }
      } else {
        try {
          return { ...ldParser(schemas), success: true }
        } catch (error: unknown) {
          continue
        }
      }
    }
  }
  return undefined
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
        if (element?.tagName === 'META' && element?.hasAttribute('content')) {
          return element.getAttribute('content') ?? ''
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
      ...(partialNewsArticle ? partialNewsArticle : {}),
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

export default listener
