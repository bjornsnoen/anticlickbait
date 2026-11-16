import styled from '@emotion/styled'
import browser from 'webextension-polyfill'

import { HostPermissions, StorageKeys } from '../constants'
import { getTapToPreviewEnabled } from '../settings'
import './Options.css'
import { ChangeEvent, useEffect, useState } from 'react'

const List = styled.ul`
  list-style-type: none;
  padding: 0;

  span {
    color: green;
  }
`

const ButtonContainer = styled.div`
  max-width: 35ch;
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: space-between;
  button {
    text-align: center;
    padding: 10px;
    border: none;
    cursor: pointer;
    border-radius: 5px;
  }
  button:first-of-type {
    background-color: #4caf50;
    color: white;
  }
`

const Settings = styled.div`
  margin: 2rem 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;

  label {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
`

function App() {
  const handler = async (all: boolean) => {
    await browser.permissions.request({
      origins: all ? [...HostPermissions] : [HostPermissions[0]],
    })
    if (!all) {
      await browser.permissions.remove({
        origins: HostPermissions.filter((host) => host !== HostPermissions[0]),
      })
    }
    const permissions = await browser.permissions.getAll()
    setGrantedPermissions(permissions.origins ?? [])
  }
  const [grantedPermissions, setGrantedPermissions] = useState<string[]>([])
  const [tapToPreviewEnabled, setTapToPreviewEnabled] = useState(false)
  const [hideVgPlus, setHideVgPlus] = useState(false)
  const [hideAds, setHideAds] = useState(false)

  const handleTapToPreviewChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked
    setTapToPreviewEnabled(enabled)
    await browser.storage.local.set({ [StorageKeys.tapToPreviewEnabled]: enabled })
  }

  const handleHideVgPlusChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked
    setHideVgPlus(enabled)
    await browser.storage.local.set({ [StorageKeys.hideVgPlus]: enabled })
  }

  const handleHideAdsChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked
    setHideAds(enabled)
    await browser.storage.local.set({ [StorageKeys.hideAds]: enabled })
  }

  useEffect(() => {
    browser.permissions.getAll().then((permissions) => {
      setGrantedPermissions(permissions.origins ?? [])
    })
  }, [])

  useEffect(() => {
    getTapToPreviewEnabled().then((enabled) => {
      setTapToPreviewEnabled(enabled)
    })
    browser.storage.local.get([StorageKeys.hideVgPlus, StorageKeys.hideAds]).then((stored) => {
      setHideVgPlus(stored[StorageKeys.hideVgPlus] === true)
      setHideAds(stored[StorageKeys.hideAds] === true)
    })
  }, [])

  return (
    <main>
      <h3>Tillatelser</h3>

      <p>
        For å kunne hente ut informasjon fra saker må utvidelsen ha tillatelse til å åpne sakene i
        bakgrunnen. For å kunne gjøre det trenger utvidelsen at du gir den tillatelse til å åpne
        disse sidene. Du kan velge å ikke gi tillatelse til alle, men for å fungere må du i det
        minste gi tilatelse til VG.no.
      </p>
      <p>
        Merk at VG ofte linker til andre nyhetskilder, og at det derfor kan være lurt å gi tilatelse
        til flere sider.
      </p>
      <List>
        {HostPermissions.map((permission) => (
          <li key={permission}>
            <span>{grantedPermissions.includes(permission) ? '✓' : ''}</span> {permission}
          </li>
        ))}
      </List>
      <ButtonContainer>
        <button onClick={() => handler(true)}>Trykk her for å gi alle tillatelser</button>
        <button onClick={() => handler(false)}>Trykk her for kun VG</button>
      </ButtonContainer>

      <h3>Interaksjon</h3>
      <Settings>
        <label>
          <input
            type="checkbox"
            checked={tapToPreviewEnabled}
            onChange={handleTapToPreviewChange}
          />
          Aktiver trykk-for-forhåndsvisning
        </label>
        <small>På mobil vil første trykk vise tittel/forfatter, andre trykk åpner saken.</small>
      </Settings>

      <h3>Innhold</h3>
      <Settings>
        <label>
          <input type="checkbox" checked={hideVgPlus} onChange={handleHideVgPlusChange} />
          Skjul innhold merket VG+
        </label>
        <label>
          <input type="checkbox" checked={hideAds} onChange={handleHideAdsChange} />
          Skul annonsørinnhold
        </label>
      </Settings>
    </main>
  )
}

export default App
