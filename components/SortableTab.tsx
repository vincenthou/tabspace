import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Workspace } from '@/types';

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
  children
}: SortableTabProps) {
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
      className={`flex items-center gap-3 p-3 bg-white border rounded-lg
        ${isCreating ? 'hover:bg-gray-50' : ''}
        ${isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}
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
    </div>
  );
} 