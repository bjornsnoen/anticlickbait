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

const didJustAffectAddendum = (mutations: MutationRecord[]): boolean => {
  if (mutations.length === 1 && mutations[0].removedNodes.length === 1) {
    const removedNode = mutations[0].removedNodes[0] as HTMLElement
    return removedNode.id === 'article-addendum'
  }
  if (mutations.length === 1 && mutations[0].addedNodes.length === 1) {
    const addedNode = mutations[0].addedNodes[0] as HTMLElement
    return addedNode.id === 'article-addendum'
  }
  return false
}

const extractArticlesFromDom = (): HTMLElement[] => {
  const articles = document.querySelectorAll('.article')
  const teasers = document.querySelectorAll('[data-test-tag^="teaser-large:link"]')

  const elementArray: HTMLElement[] = Array.from(articles).concat(
    Array.from(teasers),
  ) as HTMLElement[]

  const filtered = elementArray.filter((element) => !element.closest('.partnerstudio-front'))

  return filtered
}

export const ArticleProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [articles, setArticles] = useState<HTMLElement[]>(extractArticlesFromDom)
  const mainElementRef = useRef(document.querySelector('main') as HTMLElement)
  const [observer] = useState<MutationObserver>(() => {
    const observer = new MutationObserver((mutations) => {
      if (didJustAffectAddendum(mutations)) return
      console.log('Running observer code')
      console.log(mutations)
      setArticles(extractArticlesFromDom())
    })
    return observer
  })

  const pauseDomObserver = useCallback(() => {
    observer.disconnect()
  }, [observer])

  const resumeDomObserver = useCallback(() => {
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
