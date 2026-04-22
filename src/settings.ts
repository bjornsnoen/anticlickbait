import browser from 'webextension-polyfill'

import { StorageKeys } from './constants'

const getDefaultTapToPreviewEnabled = async (): Promise<boolean> => {
  try {
    const platformInfo = await browser.runtime.getPlatformInfo()
    return platformInfo.os === 'android'
  } catch {
    return false
  }
}

export const getTapToPreviewEnabled = async (): Promise<boolean> => {
  const stored = await browser.storage.local.get(StorageKeys.tapToPreviewEnabled)
  const value = stored[StorageKeys.tapToPreviewEnabled]

  if (typeof value === 'boolean') {
    return value
  }

  return getDefaultTapToPreviewEnabled()
}
