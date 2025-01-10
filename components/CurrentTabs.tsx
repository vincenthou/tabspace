import { TabInfo, Workspace } from '@/types';
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableTab } from './SortableTab';

const t = createI18n().t;

interface CurrentTabsProps {
  currentTabs: TabInfo[];
  isCreating: boolean;
  selectedTabUrls: Set<string>;
  workspaceName: string;
  onWorkspaceNameChange: (name: string) => void;
  onToggleTabSelection: (url: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onStartCreating: () => void;
  onCancelCreating: () => void;
  onSaveWorkspace: () => void;
  onClearTabs: () => void;
  onDragEnd: (event: any) => void;
  workspaces: Workspace[];
  onAddTabToWorkspace: (url: string, workspaceId: string) => void;
}

export function CurrentTabs({
  currentTabs,
  isCreating,
  selectedTabUrls,
  workspaceName,
  onWorkspaceNameChange,
  onToggleTabSelection,
  onSelectAll,
  onDeselectAll,
  onStartCreating,
  onCancelCreating,
  onSaveWorkspace,
  onClearTabs,
  onDragEnd,
  workspaces,
  onAddTabToWorkspace,
}: CurrentTabsProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-700">
          {t('popup.currentTabs')}
        </h2>
        <div className="flex items-center gap-3">
          {isCreating ? (
            <div className="flex gap-2">
              <button
                onClick={onSelectAll}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                {t('popup.workspace.selectAll')}
              </button>
              <button
                onClick={onDeselectAll}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                {t('popup.workspace.deselectAll')}
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={onStartCreating}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg 
                  transition-colors duration-200 font-medium shadow-sm hover:shadow-md"
              >
                {t('popup.actions.create')}
              </button>
              <button
                onClick={onClearTabs}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg 
                  transition-colors duration-200 font-medium shadow-sm hover:shadow-md"
              >
                {t('popup.actions.clear')}
              </button>
            </div>
          )}
        </div>
      </div>

      {isCreating && (
        <div className="mb-4">
          <input
            type="text"
            value={workspaceName}
            onChange={(e) => onWorkspaceNameChange(e.target.value)}
            placeholder={t('popup.workspace.input')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 
              focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={currentTabs.map((_, index) => `tab-${index}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {currentTabs.map((tab, index) => (
                <SortableTab
                  key={`tab-${index}`}
                  tab={tab}
                  index={index}
                  isCreating={isCreating}
                  isSortable={false}
                  isSelected={selectedTabUrls.has(tab.url)}
                  onSelect={() => onToggleTabSelection(tab.url)}
                  workspaces={workspaces}
                  onAddToWorkspace={onAddTabToWorkspace}
                >
                  <img 
                    src={tab.favIconUrl || 'default-favicon.png'} 
                    alt=""
                    className="w-4 h-4 flex-shrink-0"
                  />
                  <a
                    href={tab.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-sm text-gray-600 hover:text-blue-500 truncate"
                  >
                    {tab.title}
                  </a>
                </SortableTab>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {isCreating && (
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onCancelCreating}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            {t('popup.actions.cancel')}
          </button>
          <button
            onClick={onSaveWorkspace}
            disabled={!workspaceName || selectedTabUrls.size === 0}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg 
              transition-colors duration-200 font-medium shadow-sm hover:shadow-md
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('popup.actions.save')}
          </button>
        </div>
      )}
    </div>
  );
} 