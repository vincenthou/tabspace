import { useState } from 'react';
import { TabInfo, Workspace } from '@/types';
import { 
  getWorkspaces, 
  saveWorkspace, 
  updateWorkspace, 
  deleteWorkspace, 
} from '@/utils/storage';
import { createI18n } from '@wxt-dev/i18n';
import { arrayMove } from '@dnd-kit/sortable';

const t = createI18n().t;

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [editingWorkspace, setEditingWorkspace] = useState<string | null>(null);
  const [editingTabInfo, setEditingTabInfo] = useState<{workspaceId: string, url: string} | null>(null);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(new Set());

  const loadWorkspaces = async () => {
    const spaces = await getWorkspaces();
    setWorkspaces(spaces);
  };

  const handleSaveWorkspace = async (currentTabs: TabInfo[], selectedTabUrls: Set<string>, editedTitles: Record<string, string>) => {
    if (!workspaceName.trim()) {
      alert(t('popup.workspace.nameRequired'));
      return;
    }

    const tabInfos = currentTabs
      .filter(tab => selectedTabUrls.has(tab.url))
      .map(tab => ({
        url: tab.url,
        title: editedTitles[tab.url] || tab.title,
        favIconUrl: tab.favIconUrl
      }));

    const newWorkspace: Workspace = {
      id: Date.now().toString(),
      name: workspaceName.trim(),
      tabs: tabInfos,
      createdAt: Date.now()
    };

    await saveWorkspace(newWorkspace);
    setWorkspaceName('');
    setIsCreating(false);
    await loadWorkspaces();
    
    return { selectedTabUrls: new Set(), editedTitles: {} };
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    if (confirm(t('popup.workspace.deleteConfirm'))) {
      await deleteWorkspace(workspaceId);
      await loadWorkspaces();
    }
  };

  const handleUpdateWorkspaceName = async (workspace: Workspace, newName: string) => {
    if (newName.trim()) {
      await updateWorkspace({ ...workspace, name: newName.trim() });
      setEditingWorkspace(null);
      await loadWorkspaces();
    }
  };

  const handleUpdateTabTitle = async (workspace: Workspace, tabUrl: string, newTitle: string) => {
    if (newTitle.trim()) {
      const updatedTabs = workspace.tabs.map(tab => 
        tab.url === tabUrl ? { ...tab, title: newTitle.trim() } : tab
      );
      await updateWorkspace({ ...workspace, tabs: updatedTabs });
      setEditingTabInfo(null);
      await loadWorkspaces();
    }
  };

  const handleWorkspaceTabDragEnd = async (workspace: Workspace, event: any) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      const oldIndex = parseInt(active.id.split('-')[2]);
      const newIndex = parseInt(over.id.split('-')[2]);
      const newTabs = arrayMove(workspace.tabs, oldIndex, newIndex);
      await updateWorkspace({ ...workspace, tabs: newTabs });
      await loadWorkspaces();
    }
  };

  const handleAddTabToWorkspace = async (url: string, workspaceId: string) => {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const tab = tabs.find(t => t.url === url);
    if (!tab) return;

    const workspace = workspaces.find(w => w.id === workspaceId);
    if (!workspace) return;

    if (workspace.tabs.some(t => t.url === url)) {
      return;
    }

    const updatedWorkspace = {
      ...workspace,
      tabs: [...workspace.tabs, {
        url: tab.url || '',
        title: tab.title || '',
        favIconUrl: tab.favIconUrl || ''
      }]
    };

    await updateWorkspace(updatedWorkspace);
    await loadWorkspaces();
  };

  const handleDeleteTab = async (workspace: Workspace, url: string) => {
    const updatedWorkspace = {
      ...workspace,
      tabs: workspace.tabs.filter(tab => tab.url !== url)
    };

    await updateWorkspace(updatedWorkspace);
    await loadWorkspaces();
  };

  return {
    workspaces,
    isCreating,
    workspaceName,
    editingWorkspace,
    editingTabInfo,
    expandedWorkspaces,
    setIsCreating,
    setWorkspaceName,
    setEditingWorkspace,
    setEditingTabInfo,
    setExpandedWorkspaces,
    loadWorkspaces,
    handleSaveWorkspace,
    handleDeleteWorkspace,
    handleUpdateWorkspaceName,
    handleUpdateTabTitle,
    handleWorkspaceTabDragEnd,
    handleAddTabToWorkspace,
    handleDeleteTab,
  };
} 