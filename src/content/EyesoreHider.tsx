import { useEffect, useState } from 'react'
import browser from 'webextension-polyfill'
import { Global, css } from '@emotion/react'
import { StorageKeys } from '../constants'

const GlobalStyle: React.FC<{ eyesores: { path: string }[] }> = ({ eyesores }) => (
  <Global
    styles={eyesores.map(
      (eyesore) => css`
        article:has(a[href*='${eyesore.path}']),
        .partnerstudio-front:has(a[href*='${eyesore.path}']) {
          display: none;
        }

        .dr-edition-wrapper[data-edition-name^='vg-partnerstudio']:has(a[href*='${eyesore.path}']),
        track-element[data-track-element-type='AdSlot']:has(a[href*='${eyesore.path}']) {
          display: none;
        }
      `,
    )}
  />
)

export const EyesoreHider: React.FC = () => {
  const [eyesores, setEyesores] = useState<{ path: string }[]>([])
  const [hideVgPlus, setHideVgPlus] = useState(false)
  const [hideAds, setHideAds] = useState(false)
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

  useEffect(() => {
    browser.storage.local.get([StorageKeys.hideVgPlus, StorageKeys.hideAds]).then((stored) => {
      setHideVgPlus(stored[StorageKeys.hideVgPlus] === true)
      setHideAds(stored[StorageKeys.hideAds] === true)
    })

    const handleStorageChange = (
      changes: Record<string, { newValue?: unknown }>,
      areaName: string,
    ) => {
      if (areaName !== 'local') return
      if (changes[StorageKeys.hideVgPlus]) {
        setHideVgPlus(changes[StorageKeys.hideVgPlus].newValue === true)
      }
      if (changes[StorageKeys.hideAds]) {
        setHideAds(changes[StorageKeys.hideAds].newValue === true)
      }
    }

    browser.storage.onChanged.addListener(handleStorageChange)
    return () => browser.storage.onChanged.removeListener(handleStorageChange)
  }, [])

  return (
    <>
      <GlobalStyle eyesores={eyesores} />
      {hideVgPlus && (
        <Global
          styles={css`
            article:has(svg[aria-label='VG+']) {
              display: none !important;
            }
          `}
        />
      )}
      {hideAds && (
        <Global
          styles={css`
            [name='vg-partnerstudio'] {
              display: none !important;
            }
          `}
        />
      )}
    </>
  )
}
