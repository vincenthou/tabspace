import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import { TabInfo } from '@/types';

interface NavigationBarProps {
  tabs: TabInfo[];
  currentUrl: string;
}

export function NavigationBar({ tabs, currentUrl }: NavigationBarProps) {
  return (
    <NavigationMenu.Root className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-md">
      <NavigationMenu.List className="flex items-center h-12 px-4 max-w-screen-xl mx-auto">
        {tabs.map((tab, index) => (
          <NavigationMenu.Item key={index} className="relative">
            <NavigationMenu.Link
              href={tab.url}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors
                ${tab.url === currentUrl 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
            >
              <img 
                src={tab.favIconUrl || 'default-favicon.png'} 
                alt=""
                className="w-4 h-4"
              />
              <span className="truncate max-w-[200px]">{tab.title}</span>
            </NavigationMenu.Link>
          </NavigationMenu.Item>
        ))}
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
} 