import React, { useEffect, useRef, useState } from 'react'
import { PortalInjector } from './injector'

export const App: React.FC = () => {
  const [hovering, setHovering] = useState<URL>()
  const articleRef = useRef<HTMLElement>()

  const listener = async (event: MouseEvent) => {
    const article = event.target as HTMLElement
    const url =
      article.querySelector('a[itemprop="url"]')?.getAttribute('href') ??
      article.getAttribute('href')
    if (!url) return

    const urlObj = new URL(url, window.location.origin)
    if (event.type === 'mouseleave') {
      setHovering(undefined)
      articleRef.current = undefined
    } else if (event.type === 'mouseenter') {
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
    })

    return () => {
      filtered.map((article) => {
        article.removeEventListener('mouseenter', listener)
        article.removeEventListener('mouseleave', listener)
      })
    }
  }, [])

  return <PortalInjector currentUrl={hovering} article={articleRef} />
}
