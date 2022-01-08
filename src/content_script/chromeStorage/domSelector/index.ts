import { ChromeStorageKeys } from "../chromeStorageKeys"

type Status = 'on'|'off'

export const getDomSelectorStatus =async () => {
    return (await chrome.storage.local.get(ChromeStorageKeys.DOM_SELECTOR_STATUS))[ChromeStorageKeys.DOM_SELECTOR_STATUS] as Status | undefined
}

export const setDomSelectorStatus =async (status: 'on'|'off') => {
    await chrome.storage.local.set({ [ChromeStorageKeys.DOM_SELECTOR_STATUS]: status })
}