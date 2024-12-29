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
      position: 'inline',
      anchor: 'body',
      append: 'first',
      onMount: async (container) => {
        // Don't mount react app directly on <body>
        const wrapper = document.createElement("div");
        wrapper.style.position = 'sticky';
        wrapper.style.minHeight = '48px';
        wrapper.style.zIndex = '1000';
        container.append(wrapper);
  
        const root = ReactDOM.createRoot(wrapper);
        root.render(<App />);
        return { root, wrapper };
      },
    });
    ui.mount();
  },
});