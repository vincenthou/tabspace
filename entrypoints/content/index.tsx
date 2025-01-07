import React from 'react';
import ReactDOM from 'react-dom/client';
import "~/assets/tailwind.css";
import App from "./App.tsx";

export default defineContentScript({
  matches: ["*://*/*"],
  cssInjectionMode: "ui",

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'navigation-bar',
      position: 'overlay',
      zIndex: 999999,
      anchor: 'body',
      append: 'first',
      onMount: async (container) => {
        // Don't mount react app directly on <body>
        const wrapper = document.createElement("div");
        container.append(wrapper);

        // 根据显示状态设置样式
        const updateVisibility = (visible: boolean) => {
          if (visible) {
            wrapper.style.position = 'sticky';
            wrapper.style.minHeight = '48px';
            wrapper.style.zIndex = '1000';
            container.style.display = 'block';
          } else {
            container.style.display = 'none';
          }
        };

        // 监听存储变化
        chrome.storage.onChanged.addListener((changes) => {
          if (changes[StorageKeys.NAVIGATION_VISIBLE]) {
            updateVisibility(changes[StorageKeys.NAVIGATION_VISIBLE].newValue);
          }
        });
  
        const root = ReactDOM.createRoot(wrapper);
        root.render(<App />);
        return { root, wrapper };
      },
    });
    ui.mount();
  },
});