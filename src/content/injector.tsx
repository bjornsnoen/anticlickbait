import { QueryFunction, useQuery } from '@tanstack/react-query'
import React, { MutableRefObject, useEffect } from 'react'
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
    <div id="article-addendum">
      {subheading && <h3>{subheading}</h3>}
      {byline && <aside>- {byline}</aside>}
    </div>
  )
}

export const PortalInjector: React.FC<{
  currentUrl: URL | undefined
  article: MutableRefObject<HTMLElement | undefined>
}> = ({ currentUrl, article }) => {
  if (!article.current || !currentUrl) return null

  return ReactDOM.createPortal(<ArticleAddendumWrapper articleUrl={currentUrl} />, article.current)
}
