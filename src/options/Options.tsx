import styled from '@emotion/styled'
import browser from 'webextension-polyfill'

import { HostPermissions } from '../constants'
import './Options.css'
import { useEffect, useState } from 'react'

const ListContainer = styled.div`
  display: flex;
  justify-content: center;
`

const List = styled.ul`
  list-style-type: none;
  padding: 0;
  text-align: left;

  span {
    color: green;
  }
`

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: space-between;
  button {
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

  useEffect(() => {
    browser.permissions.getAll().then((permissions) => {
      setGrantedPermissions(permissions.origins ?? [])
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
      <ListContainer>
        <List>
          {HostPermissions.map((permission) => (
            <li key={permission}>
              <span>{grantedPermissions.includes(permission) ? '✓' : ''}</span> {permission}
            </li>
          ))}
        </List>
      </ListContainer>
      <ButtonContainer>
        <button onClick={() => handler(true)}>Trykk her for å gi alle tillatelser</button>
        <button onClick={() => handler(false)}>Trykk her for kun vg</button>
      </ButtonContainer>
    </main>
  )
}

export default App
