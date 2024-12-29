import { useState, useEffect } from 'react';
import { Workspace } from '@/types';
import { getWorkspaces, saveWorkspace } from '@/utils/storage';
import './App.css';

function App() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    const spaces = await getWorkspaces();
    setWorkspaces(spaces);
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
    // 关闭所有当前标签页
    const currentTabs = await chrome.tabs.query({ currentWindow: true });
    await Promise.all(currentTabs.map(tab => tab.id && chrome.tabs.remove(tab.id)));

    // 打开工作区的标签页
    for (const tab of workspace.tabs) {
      await chrome.tabs.create({ url: tab.url });
    }
  };

  const handleClearTabs = async () => {
    if (confirm('确定要关闭所有标签页吗？')) {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      await Promise.all(tabs.map(tab => tab.id && chrome.tabs.remove(tab.id)));
    }
  };

  return (
    <div className="popup-container">
      <h1>标签页管理器</h1>
      
      <div className="actions">
        <button onClick={() => setIsCreating(true)}>新建工作区</button>
        <button onClick={handleClearTabs}>清空标签页</button>
      </div>

      {isCreating && (
        <div className="create-form">
          <input
            type="text"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            placeholder="输入工作区名称"
          />
          <button onClick={handleCreateWorkspace}>保存</button>
          <button onClick={() => setIsCreating(false)}>取消</button>
        </div>
      )}

      <div className="workspaces-list">
        <h2>已保存的工作区</h2>
        {workspaces.map(workspace => (
          <div key={workspace.id} className="workspace-item">
            <span>{workspace.name}</span>
            <span>({workspace.tabs.length} 个标签页)</span>
            <button onClick={() => handleOpenWorkspace(workspace)}>
              打开
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
