import { QueryFunction, useQuery } from '@tanstack/react-query'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import { ServiceWorkerResponse, SuccessMessage } from '../types'
import browser from 'webextension-polyfill'
import { useDomObserver } from './ArticleContext'

const fetchArticle: QueryFunction<SuccessMessage> = async ({
  queryKey,
}): Promise<SuccessMessage> => {
  const articleUrl = queryKey[0] as URL
  const response = await new Promise<ServiceWorkerResponse>((resolve) => {
    browser.runtime
      .sendMessage({ type: 'clickbait', checkIfUrlExists: articleUrl.toString() })
      .then(resolve)
  })

  if (!response.success) {
    throw new Error(response.error)
  }
  return response
}

const ArticleAddendumWrapper: React.FC<{ articleUrl: URL }> = ({ articleUrl }) => {
  const { isLoading, isError, data } = useQuery<SuccessMessage>([articleUrl], fetchArticle, {
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  })

  const { resumeDomObserver } = useDomObserver()

  // Unpause the DOM observer when the component is unmounted
  useEffect(() => {
    return () => {
      resumeDomObserver()
    }
  }, [resumeDomObserver])

  if (isLoading) return null
  if (isError) return null

  const { byline, subheading } = data
  if (!byline && !subheading) return null

  return (
    <div className="article-addendum" data-anticlickbait-addendum>
      {subheading && <h3>{subheading}</h3>}
      {byline && <aside>- {byline}</aside>}
    </div>
  )
}

const getArticleTitleHost = (article: HTMLElement): HTMLElement | null => {
  const titleContainer = article.querySelector('a.color-text-primary > div:has(> h2)')
  if (!(titleContainer instanceof HTMLElement)) return null

  const existingHost = article.querySelector('[data-anticlickbait-host]')
  if (existingHost instanceof HTMLElement && existingHost.dataset.anticlickbaitHost !== undefined) {
    return existingHost
  }

  const host = document.createElement('div')
  host.dataset.anticlickbaitHost = ''
  host.className = 'article-addendum-host'
  article.appendChild(host)

  const titleBottom = titleContainer.offsetTop + titleContainer.offsetHeight
  host.style.top = `${titleBottom}px`
  return host
}

const ArticleAddendumPortal: React.FC<{ article: HTMLElement; articleUrl: URL }> = ({
  article,
  articleUrl,
}) => {
  const [host, setHost] = useState<HTMLElement | null>(null)
  const hostRef = useRef<HTMLElement | null>(null)

  useLayoutEffect(() => {
    const resolvedHost = getArticleTitleHost(article)
    if (!resolvedHost) return

    hostRef.current = resolvedHost
    resolvedHost.style.left = '0'
    resolvedHost.style.right = '0'
    resolvedHost.style.width = '100%'
    setHost(resolvedHost)

    return () => {
      resolvedHost.remove()
      hostRef.current = null
    }
  }, [article])

  if (!host) return null

  return ReactDOM.createPortal(<ArticleAddendumWrapper articleUrl={articleUrl} />, host)
}

export type ArticleTarget = {
  element: HTMLElement
  url: URL
}

export const PortalInjector: React.FC<{ targets: ArticleTarget[] }> = ({ targets }) => {
  if (!targets.length) return null

  return (
    <>
      {targets.map((target, index) => (
        <ArticleAddendumPortal
          key={`${target.url.toString()}-${index}`}
          article={target.element}
          articleUrl={target.url}
        />
      ))}
    </>
  )
}
