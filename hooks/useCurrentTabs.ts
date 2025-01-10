import { useState, useEffect } from 'react';
import { TabInfo } from '@/types';
import { arrayMove } from '@dnd-kit/sortable';

export function useCurrentTabs() {
  const [currentTabs, setCurrentTabs] = useState<TabInfo[]>([]);
  const [selectedTabUrls, setSelectedTabUrls] = useState<Set<string>>(new Set());
  const [editedTitles, setEditedTitles] = useState<Record<string, string>>({});

  const DEFAULT_TAB_URL = chrome.runtime.getURL('options.html');

  const loadCurrentTabs = async (selectAll: boolean = false) => {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const optionsUrl = chrome.runtime.getURL('options.html');
    const tabInfos = tabs
      .filter(tab => tab.url !== optionsUrl)
      .map(tab => ({
        url: tab.url || '',
        title: tab.title || '',
        favIconUrl: tab.favIconUrl || ''
      }));

    setCurrentTabs(tabInfos);
    selectAll && setSelectedTabUrls(new Set(tabInfos.map(tab => tab.url)));
  };

  const createDefaultTab = async () => {
    const tab = await chrome.tabs.create({ 
      url: DEFAULT_TAB_URL,
      pinned: true,
      active: true,
    });
    return tab;
  };

  useEffect(() => {
    const handleTabsChanged = () => {
      loadCurrentTabs();
    };

    chrome.tabs.onCreated.addListener(handleTabsChanged);
    chrome.tabs.onRemoved.addListener(handleTabsChanged);
    chrome.tabs.onUpdated.addListener(handleTabsChanged);
    chrome.tabs.onMoved.addListener(handleTabsChanged);

    return () => {
      chrome.tabs.onCreated.removeListener(handleTabsChanged);
      chrome.tabs.onRemoved.removeListener(handleTabsChanged);
      chrome.tabs.onUpdated.removeListener(handleTabsChanged);
      chrome.tabs.onMoved.removeListener(handleTabsChanged);
    };
  }, []);

  const handleCurrentTabsDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      setCurrentTabs((items) => {
        const oldIndex = parseInt(active.id.split('-')[1]);
        const newIndex = parseInt(over.id.split('-')[1]);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return {
    currentTabs,
    selectedTabUrls,
    editedTitles,
    setSelectedTabUrls,
    setEditedTitles,
    loadCurrentTabs,
    createDefaultTab,
    handleCurrentTabsDragEnd,
    DEFAULT_TAB_URL,
  };
} 