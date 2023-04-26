import { useState } from 'react'
import './Popup.css'
import { version } from '../../package.json'

function App() {
  const [crx] = useState('create-chrome-ext')

  return (
    <main>
      <h3>Popup Page!</h3>

      <h6>v {version}</h6>

      <a href="https://www.npmjs.com/package/create-chrome-ext" target="_blank" rel="noreferrer">
        Power by {crx}
      </a>
    </main>
  )
}

export default App
