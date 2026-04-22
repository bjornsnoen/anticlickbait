import React, { useCallback, useEffect, useRef, useState } from 'react'

type ArticleContextType = {
  articles: HTMLElement[]
  pauseDomObserver: () => void
  resumeDomObserver: () => void
}

const ArticleContext = React.createContext<ArticleContextType>({
  articles: [],
  pauseDomObserver: () => {
    return
  },
  resumeDomObserver: () => {
    return
  },
})

export const articleSelectors = [
  'track-element[data-testid="Teaser-main-ssr"] > article',
  'track-element[data-track-element-type="Teaser"][data-track-target-category="Article"] > article',
  'track-element[data-track-target-type="ArticleReference"][data-track-target-category="Article"] > article',
  '[data-test-tag^="teaser-large:link"]',
  '.article',
] as const

const observerRootSelectors = ['main#application > section.content > section.feed#feed', '#feed', '#application']

const isAddendumNode = (node: Node | null): node is HTMLElement => {
  return (
    node instanceof HTMLElement &&
    (node.classList.contains('article-addendum') ||
      node.dataset.anticlickbaitAddendum !== undefined)
  )
}

const didJustAffectAddendum = (mutations: MutationRecord[]): boolean => {
  if (mutations.length === 1 && mutations[0].removedNodes.length === 1) {
    return isAddendumNode(mutations[0].removedNodes[0])
  }
  if (mutations.length === 1 && mutations[0].addedNodes.length === 1) {
    return isAddendumNode(mutations[0].addedNodes[0])
  }
  return false
}

const extractArticlesFromDom = (): HTMLElement[] => {
  const elementArray: HTMLElement[] = articleSelectors.flatMap((selector) =>
    Array.from(document.querySelectorAll(selector)),
  ) as HTMLElement[]

  const filtered = elementArray.filter((element) => !element.closest('.partnerstudio-front'))

  return filtered
}

const getObserverRoot = (): HTMLElement => {
  for (const selector of observerRootSelectors) {
    const element = document.querySelector(selector)
    if (element instanceof HTMLElement) return element
  }

  return (document.body ?? document.documentElement) as HTMLElement
}

export const ArticleProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [articles, setArticles] = useState<HTMLElement[]>(extractArticlesFromDom)
  const mainElementRef = useRef<HTMLElement>(getObserverRoot())
  const [observer] = useState<MutationObserver>(() => {
    const observer = new MutationObserver((mutations) => {
      if (didJustAffectAddendum(mutations)) return
      setArticles(extractArticlesFromDom())
    })
    return observer
  })

  const pauseDomObserver = useCallback(() => {
    observer.disconnect()
  }, [observer])

  const resumeDomObserver = useCallback(() => {
    mainElementRef.current = getObserverRoot()
    observer.observe(mainElementRef.current, {
      childList: true,
      subtree: true,
    })
  }, [observer])

  useEffect(() => {
    resumeDomObserver()

    return () => {
      pauseDomObserver()
    }
  }, [])

  return (
    <ArticleContext.Provider value={{ articles, pauseDomObserver, resumeDomObserver }}>
      {children}
    </ArticleContext.Provider>
  )
}

export const useArticles = (): ArticleContextType => React.useContext(ArticleContext)

export const useDomObserver = (): Pick<
  ArticleContextType,
  'pauseDomObserver' | 'resumeDomObserver'
> => {
  const { pauseDomObserver, resumeDomObserver } = useArticles()
  return { pauseDomObserver, resumeDomObserver }
}
