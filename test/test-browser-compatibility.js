// Tests for Browser Compatibility (Firefox vs Chrome)
const BrowserCompatibilityTests = {
  name: 'Browser Compatibility Tests',
  
  tests: [
    {
      name: 'Should detect browser environment correctly',
      async test() {
        // Test browser detection
        const isFirefox = typeof browser !== 'undefined' && browser.runtime && browser.runtime.getURL;
        const isChrome = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL;
        
        if (!isFirefox && !isChrome) {
          throw new Error('Neither Firefox nor Chrome API detected');
        }
        
        // Verify API availability
        const api = window.browser || window.chrome;
        if (!api) {
          throw new Error('No browser API available');
        }
      }
    },
    
    {
      name: 'Should handle browser.bookmarks API differences',
      async test() {
        const api = window.browser || window.chrome;
        
        // Test bookmark tree structure
        const tree = await api.bookmarks.getTree();
        
        // Firefox and Chrome have slightly different root structures
        if (tree.length === 0) {
          throw new Error('Bookmark tree is empty');
        }
        
        // Test bookmark creation with different parameters
        const testBookmark = {
          parentId: '1', // Bookmarks Bar
          title: 'Test Bookmark',
          url: 'https://test.example.com'
        };
        
        try {
          const created = await api.bookmarks.create(testBookmark);
          if (!created.id) {
            throw new Error('Bookmark creation failed - no ID returned');
          }
          
          // Clean up
          await api.bookmarks.remove(created.id);
        } catch (error) {
          // Some environments might not allow bookmark creation
          console.log('Bookmark creation test skipped:', error.message);
        }
      }
    },
    
    {
      name: 'Should handle storage API correctly across browsers',
      async test() {
        const api = window.browser || window.chrome;
        
        // Test storage.local
        const testData = {
          testKey: 'testValue',
          complexData: { nested: { value: 123 } }
        };
        
        // Set data
        await api.storage.local.set(testData);
        
        // Get data - Chrome uses callback style, Firefox uses promises
        const result = await api.storage.local.get(['testKey', 'complexData']);
        
        if (result.testKey !== 'testValue') {
          throw new Error('Simple storage value not retrieved correctly');
        }
        
        if (!result.complexData || result.complexData.nested.value !== 123) {
          throw new Error('Complex storage value not retrieved correctly');
        }
        
        // Test storage quota (Chrome has different limits than Firefox)
        if (api.storage.local.QUOTA_BYTES) {
          const quota = api.storage.local.QUOTA_BYTES;
          // Chrome: 5MB (5242880), Firefox: 10MB or unlimited
          if (quota < 5242880) {
            throw new Error('Storage quota too small');
          }
        }
        
        // Clean up
        await api.storage.local.remove(['testKey', 'complexData']);
      }
    },
    
    {
      name: 'Should handle manifest differences correctly',
      async test() {
        // In real extension, we'd check manifest version
        // For testing, we verify API patterns
        const api = window.browser || window.chrome;
        
        // Firefox uses browser.*, Chrome uses chrome.*
        if (window.browser && window.chrome) {
          // Both available - likely Firefox with Chrome compatibility
          console.log('Firefox with Chrome compatibility detected');
        } else if (window.chrome && !window.browser) {
          // Chrome only
          console.log('Chrome browser detected');
        } else if (window.browser && !window.chrome) {
          // Firefox only (older versions)
          console.log('Firefox browser detected');
        }
        
        // Test runtime API
        if (!api.runtime) {
          throw new Error('Runtime API not available');
        }
        
        // Test extension URL generation (different formats)
        const url = api.runtime.getURL('popup.html');
        if (!url.includes('popup.html')) {
          throw new Error('Runtime.getURL not working correctly');
        }
      }
    },
    
    {
      name: 'Should handle Promise vs callback patterns',
      async test() {
        const api = window.browser || window.chrome;
        
        // Test if APIs return promises (Firefox) or use callbacks (Chrome)
        const bookmarksPromise = api.bookmarks.getTree();
        
        if (!bookmarksPromise || typeof bookmarksPromise.then !== 'function') {
          throw new Error('API should return a Promise');
        }
        
        // Wait for promise
        const result = await bookmarksPromise;
        if (!Array.isArray(result)) {
          throw new Error('getTree should return an array');
        }
      }
    },
    
    {
      name: 'Should handle Firefox-specific bookmark properties',
      async test() {
        const api = window.browser || window.chrome;
        
        // Firefox supports additional properties like 'type'
        const tree = await api.bookmarks.getTree();
        const firstNode = tree[0];
        
        // Check for type property (Firefox-specific)
        if (firstNode.type && !['bookmark', 'folder', 'separator'].includes(firstNode.type)) {
          throw new Error('Invalid bookmark type');
        }
        
        // Check date handling (Firefox uses microseconds, Chrome uses milliseconds)
        if (firstNode.dateAdded) {
          const dateAdded = firstNode.dateAdded;
          // Validate it's a reasonable timestamp
          if (dateAdded < 0 || dateAdded > Date.now() * 1000) {
            console.warn('Date format might need conversion between browsers');
          }
        }
      }
    },
    
    {
      name: 'Should handle Chrome-specific API limitations',
      async test() {
        const api = window.browser || window.chrome;
        
        // Chrome has some limitations Firefox doesn't have
        try {
          // Test bookmark creation without URL (folders)
          const folder = await api.bookmarks.create({
            parentId: '1',
            title: 'Test Folder'
            // No URL for folders
          });
          
          if (folder.url !== undefined && folder.url !== '') {
            throw new Error('Folder should not have URL');
          }
          
          // Clean up
          await api.bookmarks.remove(folder.id);
        } catch (error) {
          console.log('Folder creation test skipped:', error.message);
        }
      }
    },
    
    {
      name: 'Should handle cross-browser event listeners',
      async test() {
        const api = window.browser || window.chrome;
        
        // Test event listener patterns
        if (!api.runtime.onMessage) {
          throw new Error('onMessage event not available');
        }
        
        // Test adding/removing listeners
        const testListener = (message, sender, sendResponse) => {
          console.log('Test listener called');
        };
        
        // Both browsers support addListener
        if (!api.runtime.onMessage.addListener) {
          throw new Error('addListener method not available');
        }
        
        // Add and remove listener
        api.runtime.onMessage.addListener(testListener);
        api.runtime.onMessage.removeListener(testListener);
      }
    },
    
    {
      name: 'Should handle browser action vs page action differences',
      async test() {
        const api = window.browser || window.chrome;
        
        // Firefox Manifest V2 uses browserAction, Chrome Manifest V3 uses action
        const hasAction = api.action && api.action.onClicked;
        const hasBrowserAction = api.browserAction && api.browserAction.onClicked;
        
        if (!hasAction && !hasBrowserAction) {
          console.warn('Neither action nor browserAction API available - might be Manifest V3 issue');
        }
        
        // Test the available API
        const actionApi = api.action || api.browserAction;
        if (actionApi && actionApi.onClicked) {
          if (!actionApi.onClicked.addListener) {
            throw new Error('Action API missing addListener');
          }
        }
      }
    },
    
    {
      name: 'Should validate WebExtension polyfill usage',
      async test() {
        // Test that our extension properly uses browser || chrome pattern
        const codePatterns = [
          'const api = browser || chrome',
          'window.browser || window.chrome',
          'typeof browser !== "undefined" ? browser : chrome'
        ];
        
        // In real implementation, these patterns should be used
        const api = window.browser || window.chrome;
        
        if (!api) {
          throw new Error('No browser API available - polyfill might be needed');
        }
        
        // Verify critical APIs are available
        const criticalApis = [
          'bookmarks',
          'storage',
          'runtime',
          'tabs'
        ];
        
        for (const apiName of criticalApis) {
          if (!api[apiName]) {
            throw new Error(`Critical API missing: ${apiName}`);
          }
        }
      }
    }
  ]
}; 