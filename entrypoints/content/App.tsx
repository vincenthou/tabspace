import { useState } from "react";
import { NavigationBar } from '@/components/NavigationBar';
import { getWorkspaces, getNavigationVisible } from '@/utils/storage';
import { Workspace } from '@/types';

export default () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);

  useEffect(() => {
    getNavigationVisible().then((isVisible: boolean) => {
      setIsVisible(isVisible);
      if (!isVisible) {
        return;
      }
      // 获取当前激活的工作区
      getWorkspaces().then((workspaces) => {
        let activeWorkspace = workspaces.find(w => w.isActive);
        if (!activeWorkspace) {
          activeWorkspace = workspaces.length > 0 ? workspaces[0] : undefined;
        }
        setActiveWorkspace(activeWorkspace || null);
      });
    });
  }, []);

  return (
    isVisible ? <NavigationBar
      tabs={activeWorkspace?.tabs || []} 
      currentUrl={window.location.href}
    /> : null
  );
};