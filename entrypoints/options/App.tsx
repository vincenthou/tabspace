import { useState, useEffect } from 'react';
import { Workspace, TabInfo } from '@/types';
import { 
  getWorkspaces, 
  saveWorkspace, 
  updateWorkspace, 
  deleteWorkspace, 
  setActiveWorkspace,
  getNavigationVisible,
  setNavigationVisible 
} from '@/utils/storage';
import { createI18n } from '@wxt-dev/i18n';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const t = createI18n().t;

// 创建可排序的标签项组件
function SortableTab({ tab, index, workspace, isCreating, ...props }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: isCreating ? `tab-${index}` : `${workspace?.id}-tab-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded"
    >
      <div {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>
      {/* 原有的标签内容 */}
      {props.children}
    </div>
  );
}

function App() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(new Set());
  const [editingWorkspace, setEditingWorkspace] = useState<string | null>(null);
  const [isNavigationVisible, setIsNavigationVisible] = useState(true);
  const [currentTabs, setCurrentTabs] = useState<TabInfo[]>([]);
  const [selectedTabUrls, setSelectedTabUrls] = useState<Set<string>>(new Set());
  const [editedTitles, setEditedTitles] = useState<Record<string, string>>({});
  const [editingTabInfo, setEditingTabInfo] = useState<{workspaceId: string, url: string} | null>(null);

  const DEFAULT_TAB_URL = chrome.runtime.getURL('options.html');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadWorkspaces();
    loadNavigationState();
    loadCurrentTabs();
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

  const loadCurrentTabs = async () => {
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
    // 默认全选所有标签页
    setSelectedTabUrls(new Set(tabInfos.map(tab => tab.url)));
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      alert(t('popup.workspace.nameRequired'));
      return;
    }

    // 使用编辑后的标题创建工作区
    const tabInfos = currentTabs
      .filter(tab => selectedTabUrls.has(tab.url))
      .map(tab => ({
        url: tab.url,
        title: editedTitles[tab.url] || tab.title, // 使用编辑后的标题，如果没有编辑则使用原标题
        favIconUrl: tab.favIconUrl
      }));

    const newWorkspace: Workspace = {
      id: Date.now().toString(),
      name: newWorkspaceName.trim(),
      tabs: tabInfos,
      createdAt: Date.now()
    };

    await saveWorkspace(newWorkspace);
    setNewWorkspaceName('');
    setIsCreating(false);
    setEditedTitles({}); // 清空编辑状态
    await loadWorkspaces();
  };

  const handleOpenWorkspace = async (workspace: Workspace) => {
    await setActiveWorkspace(workspace.id);
    await loadWorkspaces();

    const currentTabs = await chrome.tabs.query({ currentWindow: true });
    
    // 创建默认标签页
    const defaultTab = await createDefaultTab();
    
    // 创建新标签页并保存它们的ID
    const newTabIds = new Set<number>();
    for (const tab of workspace.tabs) {
      if (tab.url !== DEFAULT_TAB_URL) {
        const newTab = await chrome.tabs.create({ 
          url: tab.url,
          active: false  // 创建时不激活
        });
        if (newTab.id) {
          newTabIds.add(newTab.id);
        }
      }
    }
    
    // 删除旧标签页
    await Promise.all(currentTabs.map(tab => {
      if (tab.id && !newTabIds.has(tab.id)) {
        return chrome.tabs.remove(tab.id);
      }
    }));

    // 激活第一个非默认标签页
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

  const toggleWorkspaceExpand = (workspaceId: string) => {
    setExpandedWorkspaces(prev => {
      const next = new Set(prev);
      if (next.has(workspaceId)) {
        next.delete(workspaceId);
      } else {
        next.add(workspaceId);
      }
      return next;
    });
  };

  const handleClearTabs = async () => {
    if (confirm(t('popup.workspace.clearConfirm'))) {
      const currentTabs = await chrome.tabs.query({ currentWindow: true });
      await createDefaultTab();
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

  const toggleTabSelection = (url: string) => {
    setSelectedTabUrls(prev => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTabUrls.size === currentTabs.length) {
      setSelectedTabUrls(new Set());
    } else {
      setSelectedTabUrls(new Set(currentTabs.map(tab => tab.url)));
    }
  };

  const handleTitleEdit = (url: string, newTitle: string) => {
    setEditedTitles(prev => ({
      ...prev,
      [url]: newTitle
    }));
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

  const handleDragEnd = (event: any) => {
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('popup.title')}</h1>
        <button
          onClick={toggleNavigation}
          className={`p-2 rounded-lg transition-colors duration-200
            ${isNavigationVisible 
              ? 'bg-blue-500 hover:bg-blue-600 text-white' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
            }`}
          title={isNavigationVisible ? t('popup.actions.hide') : t('popup.actions.show')}
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            {isNavigationVisible ? (
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
              />
            ) : (
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            )}
          </svg>
        </button>
      </div>
      
      <div className="flex gap-3 mb-6">
        <button
          onClick={async () => {
            await loadCurrentTabs();
            setIsCreating(true);
          }}
          className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg 
            transition-colors duration-200 font-medium shadow-sm hover:shadow-md"
        >
          {t('popup.actions.create')}
        </button>
        <button
          onClick={handleClearTabs}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg 
            transition-colors duration-200 font-medium shadow-sm hover:shadow-md"
        >
          {t('popup.actions.clear')}
        </button>
      </div>

      {isCreating && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow-md space-y-4">
          <input
            type="text"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            placeholder={t('popup.workspace.namePlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 
              focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedTabUrls.size === currentTabs.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-blue-500 rounded border-gray-300"
              />
              <span className="text-sm text-gray-600">{t('popup.workspace.selectAll')}</span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 
                  transition-colors duration-200"
              >
                {t('popup.actions.cancel')}
              </button>
              <button
                onClick={handleCreateWorkspace}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg 
                  transition-colors duration-200 font-medium"
              >
                {t('popup.actions.save')}
              </button>
            </div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={currentTabs.map((_, index) => `tab-${index}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="max-h-60 overflow-y-auto space-y-2">
                {currentTabs.map((tab, index) => (
                  <SortableTab
                    key={`tab-${index}`}
                    tab={tab}
                    index={index}
                    isCreating={true}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTabUrls.has(tab.url)}
                      onChange={() => toggleTabSelection(tab.url)}
                      className="w-4 h-4 text-blue-500 rounded border-gray-300 
                        focus:ring-blue-500 cursor-pointer"
                    />
                    <img 
                      src={tab.favIconUrl || 'default-favicon.png'} 
                      alt=""
                      className="w-4 h-4 flex-shrink-0"
                    />
                    <input
                      type="text"
                      value={editedTitles[tab.url] !== undefined ? editedTitles[tab.url] : tab.title}
                      onChange={(e) => handleTitleEdit(tab.url, e.target.value)}
                      className="text-sm text-gray-600 flex-1 px-2 py-1 rounded border border-transparent
                        hover:border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 
                        outline-none transition-colors"
                    />
                  </SortableTab>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          {t('popup.workspace.saved')}
        </h2>
        {workspaces.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {t('popup.workspace.empty')}
          </div>
        ) : (
          <div className="space-y-2">
            {workspaces.map(workspace => (
              <div 
                key={workspace.id} 
                className={`bg-white rounded-lg shadow-sm hover:shadow-md 
                  transition-shadow duration-200 overflow-hidden
                  ${workspace.isActive ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="flex items-center gap-3 p-4">
                  <button
                    onClick={() => toggleWorkspaceExpand(workspace.id)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg
                      className={`w-5 h-5 transform transition-transform
                        ${expandedWorkspaces.has(workspace.id) ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                  <div className="flex-1">
                    {editingWorkspace === workspace.id ? (
                      <input
                        type="text"
                        defaultValue={workspace.name}
                        onBlur={(e) => handleUpdateWorkspaceName(workspace, e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateWorkspaceName(workspace, e.currentTarget.value);
                          }
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                        autoFocus
                      />
                    ) : (
                      <h3 className="font-medium text-gray-800 cursor-pointer"
                          onClick={() => setEditingWorkspace(workspace.id)}>
                        {workspace.name}
                      </h3>
                    )}
                    <p className="text-sm text-gray-500">
                      {t('popup.workspace.tabs', workspace.tabs.length)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenWorkspace(workspace)}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg 
                        transition-colors duration-200 font-medium"
                    >
                      {t('popup.actions.open')}
                    </button>
                    <button
                      onClick={() => handleDeleteWorkspace(workspace.id)}
                      className="p-2 text-red-500 hover:text-red-600 rounded-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {expandedWorkspaces.has(workspace.id) && (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => handleWorkspaceTabDragEnd(workspace, event)}
                  >
                    <SortableContext
                      items={workspace.tabs.map((_, index) => `${workspace.id}-tab-${index}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="border-t border-gray-100 divide-y divide-gray-100">
                        {workspace.tabs.map((tab, index) => (
                          <SortableTab
                            key={`${workspace.id}-tab-${index}`}
                            tab={tab}
                            index={index}
                            workspace={workspace}
                            isCreating={false}
                          >
                            <img
                              src={tab.favIconUrl || 'default-favicon.png'}
                              alt=""
                              className="w-4 h-4"
                            />
                            <div className="flex-1 flex items-center gap-2">
                              {editingTabInfo?.workspaceId === workspace.id && 
                               editingTabInfo?.url === tab.url ? (
                                <input
                                  type="text"
                                  defaultValue={tab.title}
                                  autoFocus
                                  className="flex-1 text-sm px-2 py-1 border border-gray-300 rounded focus:ring-1 
                                    focus:ring-blue-500 focus:border-blue-500 outline-none"
                                  onBlur={(e) => handleUpdateTabTitle(workspace, tab.url, e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      handleUpdateTabTitle(workspace, tab.url, e.currentTarget.value);
                                    }
                                  }}
                                />
                              ) : (
                                <a
                                  href={tab.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 text-sm text-gray-600 hover:text-blue-500 truncate"
                                >
                                  {tab.title}
                                </a>
                              )}
                              <button
                                onClick={(e) => {
                                  e.preventDefault(); // 防止触发链接点击
                                  setEditingTabInfo({
                                    workspaceId: workspace.id,
                                    url: tab.url
                                  });
                                }}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" 
                                  />
                                </svg>
                              </button>
                            </div>
                          </SortableTab>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
