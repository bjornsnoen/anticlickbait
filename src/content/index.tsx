import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './app'

import styles from './index.css?inline'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

if (document.querySelector('body')) {
  const ourAppContainer = document.createElement('div')
  ourAppContainer.setAttribute('id', 'anticlickbait')
  document.querySelector('body')?.appendChild(ourAppContainer)

  ReactDOM.createRoot(document.getElementById('anticlickbait') as HTMLElement).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
      <style>{styles}</style>
    </React.StrictMode>,
  )
}
