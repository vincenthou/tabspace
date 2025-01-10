import { createI18n } from '@wxt-dev/i18n';
import { Workspace } from '@/types';
import { SortableTab } from './SortableTab';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

const t = createI18n().t;

interface WorkspaceItemProps {
  workspace: Workspace;
  isExpanded: boolean;
  isEditing: boolean;
  editingTabInfo: { workspaceId: string; url: string } | null;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpen: () => void;
  onUpdateName: (newName: string) => void;
  onUpdateTabTitle: (url: string, newTitle: string) => void;
  onTabDragEnd: (event: any) => void;
  onEditTab: (url: string) => void;
}

export function WorkspaceItem({
  workspace,
  isExpanded,
  isEditing,
  editingTabInfo,
  onToggleExpand,
  onEdit,
  onDelete,
  onOpen,
  onUpdateName,
  onUpdateTabTitle,
  onTabDragEnd,
  onEditTab
}: WorkspaceItemProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <div className={`bg-white rounded-lg shadow-sm hover:shadow-md 
      transition-shadow duration-200 overflow-hidden
      ${workspace.isActive ? 'ring-2 ring-blue-500' : ''}`}
    >
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={onToggleExpand}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg
            className={`w-5 h-5 transform transition-transform
              ${isExpanded ? 'rotate-90' : ''}`}
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
          {isEditing ? (
            <input
              type="text"
              defaultValue={workspace.name}
              onBlur={(e) => onUpdateName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  onUpdateName(e.currentTarget.value);
                }
              }}
              className="w-full px-2 py-1 border border-gray-300 rounded"
              autoFocus
            />
          ) : (
            <h3 
              className="font-medium text-gray-800 cursor-pointer"
              onClick={onEdit}
            >
              {workspace.name}
            </h3>
          )}
          <p className="text-sm text-gray-500">
            {t('popup.workspace.tabs', workspace.tabs.length)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onOpen}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg 
              transition-colors duration-200 font-medium"
          >
            {t('popup.actions.open')}
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-red-500 hover:text-red-600 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onTabDragEnd}
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
                  isSortable={true}
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
                        onBlur={(e) => onUpdateTabTitle(tab.url, e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            onUpdateTabTitle(tab.url, e.currentTarget.value);
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
                        e.preventDefault();
                        onEditTab(tab.url);
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
  );
} 