import { createI18n } from '@wxt-dev/i18n';
import { Workspace } from '@/types';
import { WorkspaceItem } from './WorkspaceItem';

const t = createI18n().t;

interface WorkspaceListProps {
  workspaces: Workspace[];
  expandedWorkspaces: Set<string>;
  editingWorkspace: string | null;
  editingTabInfo: { workspaceId: string; url: string } | null;
  onToggleExpand: (workspaceId: string) => void;
  onEditWorkspace: (workspaceId: string) => void;
  onDeleteWorkspace: (workspaceId: string) => void;
  onOpenWorkspace: (workspace: Workspace) => void;
  onUpdateWorkspaceName: (workspace: Workspace, newName: string) => void;
  onUpdateTabTitle: (workspace: Workspace, url: string, newTitle: string) => void;
  onWorkspaceTabDragEnd: (workspace: Workspace, event: any) => void;
  onEditTab: (workspaceId: string, url: string) => void;
}

export function WorkspaceList({
  workspaces,
  expandedWorkspaces,
  editingWorkspace,
  editingTabInfo,
  onToggleExpand,
  onEditWorkspace,
  onDeleteWorkspace,
  onOpenWorkspace,
  onUpdateWorkspaceName,
  onUpdateTabTitle,
  onWorkspaceTabDragEnd,
  onEditTab
}: WorkspaceListProps) {
  if (workspaces.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t('popup.workspace.empty')}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {workspaces.map(workspace => (
        <WorkspaceItem
          key={workspace.id}
          workspace={workspace}
          isExpanded={expandedWorkspaces.has(workspace.id)}
          isEditing={editingWorkspace === workspace.id}
          editingTabInfo={editingTabInfo}
          onToggleExpand={() => onToggleExpand(workspace.id)}
          onEdit={() => onEditWorkspace(workspace.id)}
          onDelete={() => onDeleteWorkspace(workspace.id)}
          onOpen={() => onOpenWorkspace(workspace)}
          onUpdateName={(newName) => onUpdateWorkspaceName(workspace, newName)}
          onUpdateTabTitle={(url, newTitle) => onUpdateTabTitle(workspace, url, newTitle)}
          onTabDragEnd={(event) => onWorkspaceTabDragEnd(workspace, event)}
          onEditTab={(url) => onEditTab(workspace.id, url)}
        />
      ))}
    </div>
  );
} 