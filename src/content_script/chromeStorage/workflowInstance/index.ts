import { ChromeStorageKeys } from "../chromeStorageKeys"
import { Workflow } from "../workflows"

export const getWorkflowInstance =async () => {
    return (await chrome.storage.local.get(ChromeStorageKeys.WORKFLOW_INSTANCE))[ChromeStorageKeys.WORKFLOW_INSTANCE] as Workflow | undefined
}

export const setWorkflowInstance =async (workflow: Workflow) => {
    await chrome.storage.local.set({ [ChromeStorageKeys.WORKFLOW_INSTANCE]: workflow })
}