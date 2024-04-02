import browser from 'webextension-polyfill'

export const storeEyesore = async (linkUrl: string) => {
  const promise = new Promise<void>((resolve, reject) => {
    const indexedDB = self.indexedDB.open('clickbait', 1)

    indexedDB.onupgradeneeded = () => {
      const db = indexedDB.result
      db.createObjectStore('urls', { keyPath: 'path' })
    }

    indexedDB.onsuccess = () => {
      const urlObject = new URL(linkUrl)
      const db = indexedDB.result
      const transaction = db.transaction('urls', 'readwrite')

      transaction.oncomplete = () => {
        console.log('Transaction completed')
        db.close()
        resolve()
      }

      transaction.onerror = () => {
        db.close()
        reject()
      }

      const store = transaction.objectStore('urls')
      store.put({ path: urlObject.pathname })
    }
    indexedDB.onerror = reject
  })

  return promise.then(async () => {
    const [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true })

    if (tab.id) {
      browser.tabs.sendMessage(tab.id, { type: 'eyesorestored' })
    }
  })
}

export const getEyesores = async (): Promise<{ path: string }[]> => {
  const promise = new Promise<{ path: string }[]>((resolve, reject) => {
    const indexedDB = self.indexedDB.open('clickbait', 1)

    indexedDB.onupgradeneeded = () => {
      const db = indexedDB.result
      db.createObjectStore('urls', { keyPath: 'path' })
    }

    indexedDB.onsuccess = () => {
      const db = indexedDB.result
      const transaction = db.transaction('urls', 'readonly')
      const store = transaction.objectStore('urls')
      const request = store.getAll()

      request.onsuccess = () => {
        db.close()
        resolve(request.result)
      }

      request.onerror = () => {
        db.close()
        reject(request.error)
      }
    }

    indexedDB.onerror = reject
  })

  return promise
}
