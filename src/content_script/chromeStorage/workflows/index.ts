import { ChromeStorageKeys } from "../chromeStorageKeys"

export type WorkflowStep = {
        id: string,
        selector: string,
        type: 'click'|'input'|''
        inputValue: string
        event: string
}
export type Workflow = {
    id: string,
    steps: WorkflowStep[]
}

export const getWorkflows =async () => {
    return (await chrome.storage.local.get(ChromeStorageKeys.WORKFLOWS))[ChromeStorageKeys.WORKFLOWS] as Workflow[] | undefined ?? []
}

export const setWorkflows = async (workflows: Workflow[]) => {
    await chrome.storage.local.set({ [ChromeStorageKeys.WORKFLOWS]: workflows })
}
