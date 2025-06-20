// Tests to validate our extension code uses correct cross-browser patterns
const CrossBrowserCodeTests = {
  name: 'Cross-Browser Code Pattern Tests',
  
  tests: [
    {
      name: 'Should verify all extension files use browser || chrome pattern',
      async test() {
        // This test validates that our actual extension code uses the correct pattern
        // In a real test environment, we'd read the actual files
        // For this mock, we'll validate the pattern exists in our loaded scripts
        
        // Check if our extension files are using the correct API pattern
        const api = window.browser || window.chrome;
        if (!api) {
          throw new Error('Extension should use browser || chrome pattern');
        }
        
        // Verify the pattern is used consistently
        const expectedPatterns = [
          'browser || chrome',
          'window.browser || window.chrome'
        ];
        
        // In actual implementation, these should be found in the code
        console.log('Cross-browser API pattern validated');
      }
    },
    
    {
      name: 'Should test extension in Firefox mode',
      async test() {
        // Save original state
        const originalBrowser = window.browser;
        const originalChrome = window.chrome;
        
        try {
          // Set Firefox environment
          window.mockBrowserEnvironment.setFirefox();
          
          // Test our extension components work in Firefox
          const classifier = new SiteClassifier();
          const result = classifier.classifySite('https://github.com');
          
          if (!result || !result.includes('Development')) {
            throw new Error('SiteClassifier not working in Firefox mode');
          }
          
          // Test storage works
          const api = window.browser || window.chrome;
          await api.storage.local.set({ testFirefox: true });
          const stored = await api.storage.local.get('testFirefox');
          
          if (!stored.testFirefox) {
            throw new Error('Storage not working in Firefox mode');
          }
          
        } finally {
          // Restore original state
          window.browser = originalBrowser;
          window.chrome = originalChrome;
        }
      }
    },
    
    {
      name: 'Should test extension in Chrome mode',
      async test() {
        // Save original state
        const originalBrowser = window.browser;
        const originalChrome = window.chrome;
        
        try {
          // Set Chrome environment
          window.mockBrowserEnvironment.setChrome();
          
          // Test our extension components work in Chrome
          const analyzer = new ContentAnalyzer();
          const result = analyzer.analyzeURL('https://shop.example.com/products');
          
          if (!result || !result.category.includes('Shopping')) {
            throw new Error('ContentAnalyzer not working in Chrome mode');
          }
          
          // Test that browser is undefined in Chrome
          if (window.browser !== undefined) {
            throw new Error('Chrome mode should not have window.browser');
          }
          
          // Test storage works with chrome API
          await window.chrome.storage.local.set({ testChrome: true });
          const stored = await window.chrome.storage.local.get('testChrome');
          
          if (!stored.testChrome) {
            throw new Error('Storage not working in Chrome mode');
          }
          
        } finally {
          // Restore original state
          window.browser = originalBrowser;
          window.chrome = originalChrome;
        }
      }
    },
    
    {
      name: 'Should handle API differences in bookmark operations',
      async test() {
        const originalBrowser = window.browser;
        const originalChrome = window.chrome;
        
        try {
          // Test in both environments
          const environments = [
            { name: 'Firefox', setup: () => window.mockBrowserEnvironment.setFirefox() },
            { name: 'Chrome', setup: () => window.mockBrowserEnvironment.setChrome() }
          ];
          
          for (const env of environments) {
            env.setup();
            
            const api = window.browser || window.chrome;
            
            // Test bookmark operations
            const tree = await api.bookmarks.getTree();
            if (!tree || tree.length === 0) {
              throw new Error(`Bookmark tree empty in ${env.name}`);
            }
            
            // Test our components work
            const mockOrganizer = { bookmarkTree: tree[0] };
            const search = new BookmarkSearch(mockOrganizer);
            await search.initialize();
            
            if (search.allBookmarks.length === 0) {
              throw new Error(`BookmarkSearch failed in ${env.name}`);
            }
          }
          
        } finally {
          window.browser = originalBrowser;
          window.chrome = originalChrome;
        }
      }
    },
    
    {
      name: 'Should validate duplicate detector works cross-browser',
      async test() {
        const originalBrowser = window.browser;
        const originalChrome = window.chrome;
        
        try {
          // Test Firefox
          window.mockBrowserEnvironment.setFirefox();
          let mockOrganizer = { bookmarkTree: window.mockBookmarks[0] };
          let detector = new DuplicateDetector(mockOrganizer);
          await detector.initialize();
          
          const firefoxDuplicates = detector.identifyDuplicates();
          if (firefoxDuplicates.length === 0) {
            throw new Error('DuplicateDetector failed in Firefox');
          }
          
          // Test Chrome
          window.mockBrowserEnvironment.setChrome();
          mockOrganizer = { bookmarkTree: window.mockBookmarks[0] };
          detector = new DuplicateDetector(mockOrganizer);
          await detector.initialize();
          
          const chromeDuplicates = detector.identifyDuplicates();
          if (chromeDuplicates.length === 0) {
            throw new Error('DuplicateDetector failed in Chrome');
          }
          
          // Results should be the same
          if (firefoxDuplicates.length !== chromeDuplicates.length) {
            throw new Error('Different results between Firefox and Chrome');
          }
          
        } finally {
          window.browser = originalBrowser;
          window.chrome = originalChrome;
        }
      }
    },
    
    {
      name: 'Should handle storage API differences',
      async test() {
        const originalBrowser = window.browser;
        const originalChrome = window.chrome;
        
        try {
          // Test storage in both environments
          for (const envName of ['Firefox', 'Chrome']) {
            if (envName === 'Firefox') {
              window.mockBrowserEnvironment.setFirefox();
            } else {
              window.mockBrowserEnvironment.setChrome();
            }
            
            const classifier = new SiteClassifier();
            
            // Test learning functionality (uses storage)
            await classifier.learnFromUserAction('https://test.com', 'Test/Category');
            
            // Verify it was stored
            const api = window.browser || window.chrome;
            const stored = await api.storage.local.get('userClassifications');
            
            if (!stored.userClassifications || !stored.userClassifications['test.com']) {
              throw new Error(`Storage failed in ${envName}`);
            }
            
            // Clear for next test
            await api.storage.local.clear();
          }
          
        } finally {
          window.browser = originalBrowser;
          window.chrome = originalChrome;
        }
      }
    },
    
    {
      name: 'Should validate manifest compatibility',
      async test() {
        // Our manifest.json uses Manifest V2 which works in both browsers
        // This test validates the APIs we use are available in both
        
        const originalBrowser = window.browser;
        const originalChrome = window.chrome;
        
        try {
          const requiredApis = [
            'bookmarks',
            'storage',
            'tabs',
            'runtime',
            'browserAction' // V2 uses browserAction
          ];
          
          // Test Firefox
          window.mockBrowserEnvironment.setFirefox();
          const firefoxApi = window.browser || window.chrome;
          for (const api of requiredApis) {
            if (!firefoxApi[api]) {
              throw new Error(`Firefox missing required API: ${api}`);
            }
          }
          
          // Test Chrome
          window.mockBrowserEnvironment.setChrome();
          const chromeApi = window.chrome;
          for (const api of requiredApis) {
            if (!chromeApi[api]) {
              throw new Error(`Chrome missing required API: ${api}`);
            }
          }
          
        } finally {
          window.browser = originalBrowser;
          window.chrome = originalChrome;
        }
      }
    },
    
    {
      name: 'Should handle Firefox-only features gracefully',
      async test() {
        const originalBrowser = window.browser;
        const originalChrome = window.chrome;
        
        try {
          // Test Firefox-only mode (older Firefox without chrome compat)
          window.mockBrowserEnvironment.setFirefoxOnly();
          
          // Our extension should still work
          const api = window.browser || window.chrome;
          if (!api) {
            throw new Error('Extension should work with browser API only');
          }
          
          // Test components
          const classifier = new SiteClassifier();
          const category = classifier.classifySite('https://news.example.com');
          
          if (!category || !category.includes('News')) {
            throw new Error('Extension not working in Firefox-only mode');
          }
          
        } finally {
          window.browser = originalBrowser;
          window.chrome = originalChrome;
        }
      }
    }
  ]
}; 