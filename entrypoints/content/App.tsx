import { useState } from "react";
import { NavigationBar } from '@/components/NavigationBar';
import { getWorkspaces, getNavigationVisible } from '@/utils/storage';
import { Workspace } from '@/types';

export default () => {
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);

  useEffect(() => {
    getNavigationVisible().then((isVisible: boolean) => {
      if (!isVisible) {
        return;
      }
      // 获取当前激活的工作区
      getWorkspaces().then((workspaces) => {
        // const activeWorkspace = workspaces.find(w => w.isActive);
        const activeWorkspace = workspaces.length > 0 ? workspaces[0] : null;
        setActiveWorkspace(activeWorkspace || null);
      });
    });
  }, []);

  return (
    <NavigationBar
      tabs={activeWorkspace?.tabs || []} 
      currentUrl={window.location.href}
    />
  );
};