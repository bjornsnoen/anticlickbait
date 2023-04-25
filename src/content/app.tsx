import React, { useEffect, useRef, useState } from 'react'
import { PortalInjector } from './injector'

export const App: React.FC = () => {
  const [hovering, setHovering] = useState<URL>()
  const articleRef = useRef<HTMLElement>()

  const listener = async (event: Event) => {
    const article = (event.target as HTMLElement).closest('.article') as HTMLElement
    const url =
      article.querySelector('a[itemprop="url"]')?.getAttribute('href') ??
      article.getAttribute('href')
    if (!url) return

    const urlObj = new URL(url, window.location.origin)
    if (event.type === 'mouseleave' || event.type === 'blur') {
      setHovering(undefined)
      articleRef.current = undefined
    } else if (event.type === 'mouseenter' || event.type === 'focusin') {
      setHovering(urlObj)
      articleRef.current = article
    }
  }

  useEffect(() => {
    const articles = document.querySelectorAll('.article')
    const teasers = document.querySelectorAll('[data-test-tag^="teaser-large:link"]')

    const elementArray: HTMLElement[] = Array.from(articles).concat(
      Array.from(teasers),
    ) as HTMLElement[]

    const filtered = elementArray.filter((element) => !element.closest('.partnerstudio-front'))

    filtered.map((article) => {
      article.addEventListener('mouseenter', listener)
      article.addEventListener('mouseleave', listener)
      article.addEventListener('focusin', listener)
      article.addEventListener('blur', listener)
    })

    return () => {
      filtered.map((article) => {
        article.removeEventListener('mouseenter', listener)
        article.removeEventListener('mouseleave', listener)
        article.removeEventListener('focusin', listener)
        article.removeEventListener('blur', listener)
      })
    }
  }, [])

  return <PortalInjector currentUrl={hovering} article={articleRef} />
}
