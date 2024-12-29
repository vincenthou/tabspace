import { Workspace } from '@/types';

export const StorageKeys = {
  WORKSPACES: 'workspaces'
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