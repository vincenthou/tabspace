import { Workspace } from '@/types';

export const StorageKeys = {
  WORKSPACES: 'workspaces',
  ACTIVE_WORKSPACE: 'activeWorkspace',
  NAVIGATION_VISIBLE: 'navigationVisible'
} as const;

export async function getWorkspaces(): Promise<Workspace[]> {
  const result = await chrome.storage.local.get(StorageKeys.WORKSPACES);
  return result[StorageKeys.WORKSPACES] || [];
}

export async function saveWorkspace(workspace: Workspace): Promise<void> {
  const workspaces = await getWorkspaces();
  workspaces.push(workspace);
  await chrome.storage.local.set({ [StorageKeys.WORKSPACES]: workspaces });
}

export async function updateWorkspace(updatedWorkspace: Workspace): Promise<void> {
  const workspaces = await getWorkspaces();
  const index = workspaces.findIndex(w => w.id === updatedWorkspace.id);
  if (index !== -1) {
    workspaces[index] = updatedWorkspace;
    await chrome.storage.local.set({ [StorageKeys.WORKSPACES]: workspaces });
  }
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  const workspaces = await getWorkspaces();
  const filteredWorkspaces = workspaces.filter(w => w.id !== workspaceId);
  await chrome.storage.local.set({ [StorageKeys.WORKSPACES]: filteredWorkspaces });
}

export async function setActiveWorkspace(workspaceId: string): Promise<void> {
  const workspaces = await getWorkspaces();
  const updatedWorkspaces = workspaces.map(workspace => ({
    ...workspace,
    isActive: workspace.id === workspaceId
  }));
  await chrome.storage.local.set({ [StorageKeys.WORKSPACES]: updatedWorkspaces });
}

export async function getNavigationVisible(): Promise<boolean> {
  const result = await chrome.storage.local.get(StorageKeys.NAVIGATION_VISIBLE);
  return result[StorageKeys.NAVIGATION_VISIBLE] ?? false;
}

export async function setNavigationVisible(visible: boolean): Promise<void> {
  await chrome.storage.local.set({ [StorageKeys.NAVIGATION_VISIBLE]: visible });
} 