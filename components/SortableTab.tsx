import { createI18n } from '@wxt-dev/i18n';
import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Workspace } from '@/types';

const t = createI18n().t;

interface SortableTabProps {
  tab: {
    url: string;
    title: string;
    favIconUrl?: string;
  };
  index: number;
  isCreating?: boolean;
  isSortable: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  workspace?: Workspace;
  workspaces?: Workspace[];
  onAddToWorkspace?: (url: string, workspaceId: string) => void;
  onDeleteTab?: (url: string) => void;
  children: React.ReactNode;
}

export function SortableTab({
  tab,
  index,
  isCreating = false,
  isSortable,
  isSelected,
  onSelect,
  workspace,
  workspaces,
  onAddToWorkspace,
  onDeleteTab,
  children
}: SortableTabProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ 
    id: workspace 
      ? `${workspace.id}-tab-${index}` 
      : `tab-${index}` 
  });

  const style = transform ? {
    transform: CSS.Transform.toString(transform),
    transition,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-white border rounded-lg relative
        ${isCreating ? 'hover:bg-gray-50' : ''}
        ${isCreating && isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}
      onClick={isCreating ? onSelect : undefined}
    >
      {isSortable && (
        <div
          className="cursor-move p-1 text-gray-400 hover:text-gray-600"
          {...attributes}
          {...listeners}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M4 8h16M4 16h16" />
          </svg>
        </div>
      )}
      
      {isCreating && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500"
          onClick={(e) => e.stopPropagation()}
        />
      )}
      {children}
      
      {!isCreating && !workspace && workspaces && (
        <div className="relative">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
            title={t('popup.actions.addToWorkspace')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 4v16m8-8H4" />
            </svg>
          </button>
          
          {showDropdown && (
            <div 
              className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg 
                border border-gray-200 py-1 z-50"
            >
              {workspaces.map(ws => (
                <button
                  key={ws.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onAddToWorkspace?.(tab.url, ws.id);
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 
                    hover:bg-gray-100 truncate"
                >
                  {ws.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {workspace && onDeleteTab && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDeleteTab(tab.url);
          }}
          className="p-1 text-gray-400 hover:text-red-500 rounded-lg"
          title={t('popup.actions.deleteTab')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
} 