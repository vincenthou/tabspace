export interface TabInfo {
  url: string;
  title: string;
  favIconUrl: string;
}

export interface Workspace {
  id: string;
  name: string;
  tabs: TabInfo[];
  createdAt: number;
  isActive?: boolean;
} 