export default defineBackground(() => {
  // 监听插件图标点击事件
  chrome.action.onClicked.addListener(async () => {
    const optionsUrl = chrome.runtime.getURL('options.html');
    
    // 查找是否已经存在options页面
    const tabs = await chrome.tabs.query({ url: optionsUrl });
    
    if (tabs.length > 0) {
      // 如果已存在,则激活该标签页
      await chrome.tabs.update(tabs[0].id!, { active: true, pinned: true });
      await chrome.windows.update(tabs[0].windowId, { focused: true });
    } else {
      // 如果不存在,则创建新的标签页
      await chrome.tabs.create({
        url: optionsUrl,
        active: true,
        pinned: true
      });
    }
  });
});
