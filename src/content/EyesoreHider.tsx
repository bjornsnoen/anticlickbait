import { useEffect, useState } from 'react'
import browser from 'webextension-polyfill'
import { Global, css } from '@emotion/react'

const GlobalStyle: React.FC<{ eyesores: { path: string }[] }> = ({ eyesores }) => (
  <Global
    styles={eyesores.map(
      (eyesore) => css`
        article:has(a[href*='${eyesore.path}']),
        .partnerstudio-front:has(a[href*='${eyesore.path}']) {
          display: none;
        }
      `,
    )}
  />
)

export const EyesoreHider: React.FC = () => {
  const [eyesores, setEyesores] = useState<{ path: string }[]>([])
  const [counter, setCount] = useState(0)
  const [eyesoreUpdateListener] = useState(() => {
    const listener = (message: MessageEvent) => {
      if (message.type === 'eyesorestored') {
        // Force a rerender
        setCount((prevValue) => prevValue + 1)
      }
    }

    return listener
  })

  useEffect(() => {
    browser.runtime.sendMessage({ type: 'eyesorerequest' }).then((response) => {
      setEyesores(response)
    })
  }, [counter])

  useEffect(() => {
    browser.runtime.onMessage.addListener(eyesoreUpdateListener)
    return () => browser.runtime.onMessage.removeListener(eyesoreUpdateListener)
  }, [])

  return <GlobalStyle eyesores={eyesores} />
}
