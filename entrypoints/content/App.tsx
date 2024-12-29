import { useState } from "react";
import { NavigationBar } from '@/components/NavigationBar';
import { Workspace } from '@/types';

export default () => {
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);

  useEffect(() => {
    // 获取当前激活的工作区
    getWorkspaces().then((workspaces) => {
      // const activeWorkspace = workspaces.find(w => w.isActive);
      const activeWorkspace = workspaces.length > 0 ? workspaces[0] : null;
      console.log(activeWorkspace, workspaces, 'activeWorkspace');
      setActiveWorkspace(activeWorkspace || null);
    });
  }, []);

  return (
    <NavigationBar
      tabs={activeWorkspace?.tabs || []} 
      currentUrl={window.location.href}
    />
  );
};