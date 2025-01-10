import { useEffect } from 'react';
import { createI18n } from '@wxt-dev/i18n';
import { Workspace } from '@/types';
import { resetActiveWorkspace } from '@/utils/storage';
import { Header } from '@/components/Header';
import { CurrentTabs } from '@/components/CurrentTabs';
import { WorkspaceList } from '@/components/WorkspaceList';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useCurrentTabs } from '@/hooks/useCurrentTabs';
import { useNavigation } from '@/hooks/useNavigation';

const t = createI18n().t;

function App() {
  const {
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
  } = useWorkspaces();

  const {
    currentTabs,
    selectedTabUrls,
    editedTitles,
    setSelectedTabUrls,
    setEditedTitles,
    loadCurrentTabs,
    createDefaultTab,
    handleAddCurrentTabs,
    handleCurrentTabsDragEnd,
    DEFAULT_TAB_URL,
  } = useCurrentTabs();

  const {
    isNavigationVisible,
    loadNavigationState,
    toggleNavigation,
  } = useNavigation();

  useEffect(() => {
    loadWorkspaces();
    loadNavigationState();
    loadCurrentTabs();
  }, []);

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

  const handleClearTabs = async () => {
    if (confirm(t('popup.workspace.clearConfirm'))) {
      const currentTabs = await chrome.tabs.query({ currentWindow: true });
      await createDefaultTab();
      await resetActiveWorkspace();
      await Promise.all(currentTabs.map(tab => tab.id && chrome.tabs.remove(tab.id)));
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
        onSaveWorkspace={() => handleSaveWorkspace(currentTabs, selectedTabUrls, editedTitles)}
        onClearTabs={handleClearTabs}
        onDragEnd={handleCurrentTabsDragEnd}
        workspaces={workspaces}
        onAddTabToWorkspace={(...args) => handleAddTabToWorkspace(currentTabs, ...args)}
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
          onAddCurrentTabs={handleAddCurrentTabs}
        />
      </div>
    </div>
  );
}

export default App;
