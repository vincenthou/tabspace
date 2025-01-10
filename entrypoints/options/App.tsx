import { useState, useEffect } from 'react';
import { createI18n } from '@wxt-dev/i18n';
import { Workspace, TabInfo } from '@/types';
import { 
  getWorkspaces, 
  saveWorkspace, 
  updateWorkspace, 
  deleteWorkspace, 
  setActiveWorkspace,
  resetActiveWorkspace,
  getNavigationVisible,
  setNavigationVisible 
} from '@/utils/storage';
import { Header } from '@/components/Header';
import { CurrentTabs } from '@/components/CurrentTabs';
import { WorkspaceList } from '@/components/WorkspaceList';
import { arrayMove } from '@dnd-kit/sortable';

const t = createI18n().t;

function App() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [selectedTabUrls, setSelectedTabUrls] = useState<Set<string>>(new Set());
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(new Set());
  const [editingWorkspace, setEditingWorkspace] = useState<string | null>(null);
  const [isNavigationVisible, setIsNavigationVisible] = useState(true);
  const [currentTabs, setCurrentTabs] = useState<TabInfo[]>([]);
  const [editedTitles, setEditedTitles] = useState<Record<string, string>>({});
  const [editingTabInfo, setEditingTabInfo] = useState<{workspaceId: string, url: string} | null>(null);

  const DEFAULT_TAB_URL = chrome.runtime.getURL('options.html');

  useEffect(() => {
    loadWorkspaces();
    loadNavigationState();
    loadCurrentTabs();
  }, []);

  // 添加 chrome.tabs 事件监听
  useEffect(() => {
    const handleTabsChanged = () => {
      loadCurrentTabs();
    };

    chrome.tabs.onCreated.addListener(handleTabsChanged);
    chrome.tabs.onRemoved.addListener(handleTabsChanged);
    chrome.tabs.onUpdated.addListener(handleTabsChanged);
    chrome.tabs.onMoved.addListener(handleTabsChanged);

    return () => {
      chrome.tabs.onCreated.removeListener(handleTabsChanged);
      chrome.tabs.onRemoved.removeListener(handleTabsChanged);
      chrome.tabs.onUpdated.removeListener(handleTabsChanged);
      chrome.tabs.onMoved.removeListener(handleTabsChanged);
    };
  }, []);

  const loadWorkspaces = async () => {
    const spaces = await getWorkspaces();
    setWorkspaces(spaces);
  };

  const createDefaultTab = async () => {
    const tab = await chrome.tabs.create({ 
      url: DEFAULT_TAB_URL,
      pinned: true,
      active: true,
    });
    return tab;
  };

  const loadCurrentTabs = async (selectAll: boolean = false) => {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const optionsUrl = chrome.runtime.getURL('options.html');
    const tabInfos = tabs
      .filter(tab => tab.url !== optionsUrl)
      .map(tab => ({
        url: tab.url || '',
        title: tab.title || '',
        favIconUrl: tab.favIconUrl || ''
      }));

    setCurrentTabs(tabInfos);
    selectAll && setSelectedTabUrls(new Set(tabInfos.map(tab => tab.url)));
  };

  const handleSaveWorkspace = async () => {
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
    setSelectedTabUrls(new Set());
    setEditedTitles({});
    await loadWorkspaces();
  };

  const handleOpenWorkspace = async (workspace: Workspace) => {
    await setActiveWorkspace(workspace.id);
    await loadWorkspaces();

    const currentTabs = await chrome.tabs.query({ currentWindow: true });
    
    const defaultTab = await createDefaultTab();
    
    const newTabIds = new Set<number>();
    for (const tab of workspace.tabs) {
      if (tab.url !== DEFAULT_TAB_URL) {
        const newTab = await chrome.tabs.create({ 
          url: tab.url,
          active: false
        });
        if (newTab.id) {
          newTabIds.add(newTab.id);
        }
      }
    }
    
    await Promise.all(currentTabs.map(tab => {
      if (tab.id && !newTabIds.has(tab.id)) {
        return chrome.tabs.remove(tab.id);
      }
    }));

    const allTabs = await chrome.tabs.query({ currentWindow: true });
    const firstNonDefaultTab = allTabs.find(tab => 
      tab.url !== DEFAULT_TAB_URL && newTabIds.has(tab.id!)
    );
    if (firstNonDefaultTab?.id) {
      await chrome.tabs.update(firstNonDefaultTab.id, { active: true });
    }
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

  const handleClearTabs = async () => {
    if (confirm(t('popup.workspace.clearConfirm'))) {
      const currentTabs = await chrome.tabs.query({ currentWindow: true });
      await createDefaultTab();
      await resetActiveWorkspace();
      await Promise.all(currentTabs.map(tab => tab.id && chrome.tabs.remove(tab.id)));
    }
  };

  const loadNavigationState = async () => {
    const visible = await getNavigationVisible();
    setIsNavigationVisible(visible);
  };

  const toggleNavigation = async () => {
    const newState = !isNavigationVisible;
    await setNavigationVisible(newState);
    setIsNavigationVisible(newState);
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

  const handleCurrentTabsDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      setCurrentTabs((items) => {
        const oldIndex = parseInt(active.id.split('-')[1]);
        const newIndex = parseInt(over.id.split('-')[1]);
        return arrayMove(items, oldIndex, newIndex);
      });
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

  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      <Header 
        isNavigationVisible={isNavigationVisible}
        onToggleNavigation={toggleNavigation}
      />
      
      <CurrentTabs
        currentTabs={currentTabs}
        isCreating={isCreating}
        selectedTabUrls={selectedTabUrls}
        workspaceName={workspaceName}
        onWorkspaceNameChange={setWorkspaceName}
        onToggleTabSelection={(url) => {
          setSelectedTabUrls(prev => {
            const next = new Set(prev);
            if (next.has(url)) {
              next.delete(url);
            } else {
              next.add(url);
            }
            return next;
          });
        }}
        onSelectAll={() => setSelectedTabUrls(new Set(currentTabs.map(tab => tab.url)))}
        onDeselectAll={() => setSelectedTabUrls(new Set())}
        onStartCreating={() => {
          setIsCreating(true);
          loadCurrentTabs(true);
        }}
        onCancelCreating={() => {
          setIsCreating(false);
          setWorkspaceName('');
          setSelectedTabUrls(new Set());
        }}
        onSaveWorkspace={handleSaveWorkspace}
        onClearTabs={handleClearTabs}
        onDragEnd={handleCurrentTabsDragEnd}
      />

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          {t('popup.workspace.saved')}
        </h2>
        <WorkspaceList
          workspaces={workspaces}
          expandedWorkspaces={expandedWorkspaces}
          editingWorkspace={editingWorkspace}
          editingTabInfo={editingTabInfo}
          onToggleExpand={(workspaceId) => {
            setExpandedWorkspaces(prev => {
              const next = new Set(prev);
              if (next.has(workspaceId)) {
                next.delete(workspaceId);
              } else {
                next.add(workspaceId);
              }
              return next;
            });
          }}
          onEditWorkspace={setEditingWorkspace}
          onDeleteWorkspace={handleDeleteWorkspace}
          onOpenWorkspace={handleOpenWorkspace}
          onUpdateWorkspaceName={handleUpdateWorkspaceName}
          onUpdateTabTitle={handleUpdateTabTitle}
          onWorkspaceTabDragEnd={handleWorkspaceTabDragEnd}
          onEditTab={(workspaceId, url) => {
            setEditingTabInfo({
              workspaceId,
              url
            });
          }}
        />
      </div>
    </div>
  );
}

export default App;
