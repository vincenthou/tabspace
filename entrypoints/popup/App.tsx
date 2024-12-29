import { useState, useEffect } from 'react';
import { Workspace } from '@/types';
import { getWorkspaces, saveWorkspace } from '@/utils/storage';

function App() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  const DEFAULT_TAB_URL = 'https://www.bing.com';
  const DEFAULT_TAB_WIDTH = 100; // 设置较窄的宽度

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    const spaces = await getWorkspaces();
    setWorkspaces(spaces);
  };

  const createDefaultTab = async () => {
    const tab = await chrome.tabs.create({ 
      url: DEFAULT_TAB_URL,
      // width: DEFAULT_TAB_WIDTH,
      pinned: true // 固定标签页
    });
    return tab;
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      alert('请输入工作区名称');
      return;
    }

    const tabs = await chrome.tabs.query({ currentWindow: true });
    const newWorkspace: Workspace = {
      id: Date.now().toString(),
      name: newWorkspaceName.trim(),
      tabs,
      createdAt: Date.now()
    };

    await saveWorkspace(newWorkspace);
    setNewWorkspaceName('');
    setIsCreating(false);
    await loadWorkspaces();
  };

  const handleOpenWorkspace = async (workspace: Workspace) => {
    // 关闭除了默认标签页之外的所有标签页
    const currentTabs = await chrome.tabs.query({ currentWindow: true });
    
    // 先创建默认标签页
    const defaultTab = await createDefaultTab();
    
    // 关闭其他标签页
    await Promise.all(currentTabs.map(tab => tab.id && chrome.tabs.remove(tab.id)));
    
    // 打开工作区的标签页
    for (const tab of workspace.tabs) {
      if (tab.url !== DEFAULT_TAB_URL) {
        await chrome.tabs.create({ url: tab.url });
      }
    }
  };

  const handleClearTabs = async () => {
    if (confirm('确定要关闭所有标签页吗？')) {
      const currentTabs = await chrome.tabs.query({ currentWindow: true });
      
      // 先创建默认标签页
      await createDefaultTab();
      
      // 关闭其他标签页
      await Promise.all(currentTabs.map(tab => tab.id && chrome.tabs.remove(tab.id)));
    }
  };

  return (
    <div className="w-[400px] min-h-[300px] p-6 bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">标签页管理器</h1>
      
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setIsCreating(true)}
          className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg 
            transition-colors duration-200 font-medium shadow-sm hover:shadow-md"
        >
          新建工作区
        </button>
        <button
          onClick={handleClearTabs}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg 
            transition-colors duration-200 font-medium shadow-sm hover:shadow-md"
        >
          清空标签页
        </button>
      </div>

      {isCreating && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow-md space-y-4">
          <input
            type="text"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            placeholder="输入工作区名称"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 
              focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
          />
          <div className="flex gap-3">
            <button
              onClick={handleCreateWorkspace}
              className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white 
                rounded-lg transition-colors duration-200 font-medium"
            >
              保存
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="flex-1 px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white 
                rounded-lg transition-colors duration-200 font-medium"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">已保存的工作区</h2>
        {workspaces.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            还没有保存的工作区
          </div>
        ) : (
          <div className="space-y-2">
            {workspaces.map(workspace => (
              <div 
                key={workspace.id} 
                className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm 
                  hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">{workspace.name}</h3>
                  <p className="text-sm text-gray-500">
                    {workspace.tabs.length} 个标签页
                  </p>
                </div>
                <button
                  onClick={() => handleOpenWorkspace(workspace)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg 
                    transition-colors duration-200 font-medium"
                >
                  打开
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
