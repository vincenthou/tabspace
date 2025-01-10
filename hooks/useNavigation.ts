import { useState } from 'react';
import { getNavigationVisible, setNavigationVisible } from '@/utils/storage';

export function useNavigation() {
  const [isNavigationVisible, setIsNavigationVisible] = useState(true);

  const loadNavigationState = async () => {
    const visible = await getNavigationVisible();
    setIsNavigationVisible(visible);
  };

  const toggleNavigation = async () => {
    const newState = !isNavigationVisible;
    await setNavigationVisible(newState);
    setIsNavigationVisible(newState);
  };

  return {
    isNavigationVisible,
    loadNavigationState,
    toggleNavigation,
  };
} 