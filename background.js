// Background script for Bookmark Tools - Firefox WebExtension
// Uses Firefox's native browser API

browser.runtime.onInstalled.addListener(() => {
  console.log('Bookmark Tools installed');
  
  // Initialize default settings
  browser.storage.local.get(['categories', 'customRules'], (result) => {
    if (!result.categories) {
      browser.storage.local.set({
        categories: {},
        customRules: []
      });
    }
  });
});

// Handle extension icon click - create persistent tab
let bookmarkToolsTab = null;

browser.browserAction.onClicked.addListener(async (tab) => {
  // Check if tab already exists and is open
  if (bookmarkToolsTab) {
    try {
      await browser.tabs.get(bookmarkToolsTab.id);
      // Tab exists, focus it
      await browser.tabs.update(bookmarkToolsTab.id, { active: true });
      await browser.windows.update(bookmarkToolsTab.windowId, { focused: true });
      return;
    } catch (error) {
      // Tab was closed, create new one
      bookmarkToolsTab = null;
    }
  }
  
  // Create new tab
  bookmarkToolsTab = await browser.tabs.create({
    url: browser.runtime.getURL('popup.html'),
    active: true
  });
});

// Clean up tab reference when tab is closed
browser.tabs.onRemoved.addListener((tabId) => {
  if (bookmarkToolsTab && bookmarkToolsTab.id === tabId) {
    bookmarkToolsTab = null;
  }
});

// Message handler for content analysis
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'analyzeUrl') {
    // Placeholder for future enhancements
    sendResponse({ category: null });
  }
  
  // Removed fetchPageData functionality due to CORS limitations
  
  return true;
});

// Page fetching functionality removed due to CORS and permission limitations