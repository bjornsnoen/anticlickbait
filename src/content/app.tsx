import React, { useCallback, useEffect, useRef, useState } from 'react'
import browser from 'webextension-polyfill'
import { PortalInjector, ArticleTarget } from './injector'
import { useArticles, useDomObserver } from './ArticleContext'
import { StorageKeys } from '../constants'
import { getTapToPreviewEnabled } from '../settings'

const getArticleUrl = (article: HTMLElement): URL | null => {
  const url =
    article.querySelector('a[itemprop="url"]')?.getAttribute('href') ??
    article.getAttribute('href') ??
    article.querySelector('a')?.getAttribute('href')

  if (!url) return null
  return new URL(url, window.location.origin)
}

const getArticleTarget = (article: HTMLElement): ArticleTarget | null => {
  const url = getArticleUrl(article)
  if (!url) return null
  return { url, element: article }
}

const getArticleElement = (target: EventTarget | null): HTMLElement | null => {
  if (!(target instanceof HTMLElement)) return null
  return target.closest('article') as HTMLElement | null
}

const isInViewport = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect()
  return rect.bottom >= 0 && rect.top <= window.innerHeight
}

const uniqueTargets = (targets: ArticleTarget[]): ArticleTarget[] => {
  const seen = new WeakSet<HTMLElement>()
  return targets.filter((target) => {
    if (seen.has(target.element)) return false
    seen.add(target.element)
    return true
  })
}

export const App: React.FC = () => {
  const [hoverTarget, setHoverTarget] = useState<ArticleTarget | null>(null)
  const hoverTargetRef = useRef<ArticleTarget | null>(null)
  const [actionTargets, setActionTargets] = useState<ArticleTarget[]>([])
  const [tapToPreviewEnabled, setTapToPreviewEnabled] = useState(false)
  const isClickingTracker = useRef(false)
  const { articles } = useArticles()
  const { pauseDomObserver } = useDomObserver()

  const updateHoverTarget = useCallback((target: ArticleTarget | null) => {
    hoverTargetRef.current = target
    setHoverTarget(target)
  }, [])

  /**
   * We had an issue where middle clicking an article would scroll it into view as if it was focused.
   * This keeps track of whether the user is clicking or not, and the state is used to determine if the article should be scrolled into view.
   */
  const clickListener = useCallback((event: MouseEvent) => {
    if (event.type === 'mousedown') {
      isClickingTracker.current = true
      // Reset after 100ms
      // mouseup event is not reliable for middle click
      setTimeout(() => {
        isClickingTracker.current = false
      }, 100)
    }
  }, [])

  const listener = useCallback(
    async (event: Event) => {
      const article = getArticleElement(event.target)
      if (!article) return
      const target = getArticleTarget(article)

      if (!target) {
        console.log('[anticlickbait] No url found for article', article)
        return
      }

      if (event.type === 'mouseleave' || event.type === 'blur') {
        updateHoverTarget(null)
        return
      }

      if (event.type === 'mouseenter' || event.type === 'focusin') {
        pauseDomObserver()
        updateHoverTarget(target)
      }

      if (event.type === 'focusin') {
        const isReduced = window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true

        if (!isClickingTracker.current) {
          article.scrollIntoView({ behavior: isReduced ? 'auto' : 'smooth', block: 'center' })
        }
      }
    },
    [pauseDomObserver, updateHoverTarget],
  )

  const tapPreviewListener = useCallback(
    (event: Event) => {
      if (!tapToPreviewEnabled) return
      const article = getArticleElement(event.target)
      if (!article) return
      const target = getArticleTarget(article)
      if (!target) return

      const isAlreadyPreviewed =
        hoverTargetRef.current?.element === article &&
        hoverTargetRef.current?.url.toString() === target.url.toString()

      if (isAlreadyPreviewed) return

      event.preventDefault()
      event.stopPropagation()
      pauseDomObserver()
      updateHoverTarget(target)
    },
    [pauseDomObserver, tapToPreviewEnabled, updateHoverTarget],
  )

  useEffect(() => {
    const loadTapSetting = async () => {
      setTapToPreviewEnabled(await getTapToPreviewEnabled())
    }
    loadTapSetting()

    const handleStorageChange = (
      changes: Record<string, { newValue?: unknown }>,
      areaName: string,
    ) => {
      if (areaName !== 'local' || !changes[StorageKeys.tapToPreviewEnabled]) return
      setTapToPreviewEnabled(Boolean(changes[StorageKeys.tapToPreviewEnabled].newValue))
    }

    browser.storage.onChanged.addListener(handleStorageChange)
    return () => {
      browser.storage.onChanged.removeListener(handleStorageChange)
    }
  }, [])

  useEffect(() => {
    const handleMessage = (message: { type?: string }) => {
      if (message.type !== 'reveal-viewport') return
      const visibleTargets = uniqueTargets(
        articles
          .filter(isInViewport)
          .map((article) => getArticleTarget(article))
          .filter((target): target is ArticleTarget => Boolean(target)),
      )
      setActionTargets((previousTargets) => (previousTargets.length ? [] : visibleTargets))
    }

    browser.runtime.onMessage.addListener(handleMessage)
    return () => {
      browser.runtime.onMessage.removeListener(handleMessage)
    }
  }, [articles])

  useEffect(() => {
    articles.map((article) => {
      article.addEventListener('mouseenter', listener)
      article.addEventListener('mouseleave', listener)
      article.addEventListener('focusin', listener)
      article.addEventListener('blur', listener)
      article.addEventListener('mousedown', clickListener)
      if (tapToPreviewEnabled) {
        article.addEventListener('click', tapPreviewListener, { capture: true })
      }
    })

    return () => {
      articles.map((article) => {
        article.removeEventListener('mouseenter', listener)
        article.removeEventListener('mouseleave', listener)
        article.removeEventListener('focusin', listener)
        article.removeEventListener('blur', listener)
        article.removeEventListener('mousedown', clickListener)
        article.removeEventListener('click', tapPreviewListener, { capture: true })
      })
    }
  }, [articles, clickListener, listener, tapPreviewListener, tapToPreviewEnabled])

  const targets = uniqueTargets([...(hoverTarget ? [hoverTarget] : []), ...actionTargets])

  return <PortalInjector targets={targets} />
}
