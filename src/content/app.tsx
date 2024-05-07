import React, { useEffect, useRef, useState } from 'react'
import { PortalInjector } from './injector'
import { useArticles, useDomObserver } from './ArticleContext'

export const App: React.FC = () => {
  const [hovering, setHovering] = useState<URL>()
  const articleRef = useRef<HTMLElement>()
  const isClickingTracker = useRef(false)
  const { articles } = useArticles()
  const { pauseDomObserver } = useDomObserver()

  /**
   * We had an issue where middle clicking an article would scroll it into view as if it was focused.
   * This keeps track of whether the user is clicking or not, and the state is used to determine if the article should be scrolled into view.
   */
  const clickListener = (event: MouseEvent) => {
    if (event.type === 'mousedown') {
      isClickingTracker.current = true
      // Reset after 100ms
      // mouseup event is not reliable for middle click
      setTimeout(() => {
        isClickingTracker.current = false
      }, 100)
    }
  }

  const listener = async (event: Event) => {
    const article = (event.target as HTMLElement).closest('.article') as HTMLElement
    const url =
      article.querySelector('a[itemprop="url"]')?.getAttribute('href') ??
      article.getAttribute('href') ??
      article.querySelector('a')?.getAttribute('href')

    if (!url) {
      console.log('[anticlickbait] No url found for article', article)
      return
    }

    const urlObj = new URL(url, window.location.origin)
    if (event.type === 'mouseleave' || event.type === 'blur') {
      setHovering(undefined)
      articleRef.current = undefined
    } else if (event.type === 'mouseenter' || event.type === 'focusin') {
      pauseDomObserver()
      setHovering(urlObj)
      articleRef.current = article
    }
    if (event.type === 'focusin') {
      const isReduced = window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true

      if (!isClickingTracker.current) {
        article.scrollIntoView({ behavior: isReduced ? 'auto' : 'smooth', block: 'center' })
      }
    }
  }

  useEffect(() => {
    articles.map((article) => {
      article.addEventListener('mouseenter', listener)
      article.addEventListener('mouseleave', listener)
      article.addEventListener('focusin', listener)
      article.addEventListener('blur', listener)
      article.addEventListener('mousedown', clickListener)
    })

    return () => {
      articles.map((article) => {
        article.removeEventListener('mouseenter', listener)
        article.removeEventListener('mouseleave', listener)
        article.removeEventListener('focusin', listener)
        article.removeEventListener('blur', listener)
        article.removeEventListener('mousedown', clickListener)
      })
    }
  }, [articles])

  return <PortalInjector currentUrl={hovering} article={articleRef} />
}
