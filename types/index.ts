export interface Workspace {
  id: string;
  name: string;
  tabs: chrome.tabs.Tab[];
  createdAt: number;
} 