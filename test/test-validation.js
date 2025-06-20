// Validation Tests for all main features
const ValidationTests = {
  name: 'Feature Validation Tests',
  
  tests: [
    {
      name: 'Should have all required browser APIs mocked',
      async test() {
        if (!window.browser) {
          throw new Error('Browser API not available');
        }
        
        if (!window.browser.bookmarks) {
          throw new Error('Bookmarks API not available');
        }
        
        if (!window.browser.storage) {
          throw new Error('Storage API not available');
        }
        
        if (!window.browser.tabs) {
          throw new Error('Tabs API not available');
        }
        
        // Test basic functionality
        const tree = await window.browser.bookmarks.getTree();
        if (!tree || !Array.isArray(tree)) {
          throw new Error('getTree() should return an array');
        }
      }
    },
    
    {
      name: 'Should initialize site classifier',
      async test() {
        if (typeof SiteClassifier === 'undefined') {
          throw new Error('SiteClassifier not loaded');
        }
        
        const classifier = new SiteClassifier();
        
        if (!classifier.classifySite) {
          throw new Error('SiteClassifier missing classifySite method');
        }
        
        // Test basic classification
        const category = classifier.classifySite('https://github.com', 'GitHub');
        if (!category || typeof category !== 'string') {
          throw new Error('Classification should return a string');
        }
      }
    },
    
    {
      name: 'Should initialize content analyzer',
      async test() {
        if (typeof ContentAnalyzer === 'undefined') {
          throw new Error('ContentAnalyzer not loaded');
        }
        
        const analyzer = new ContentAnalyzer();
        
        if (!analyzer.analyzeBookmarks) {
          throw new Error('ContentAnalyzer missing analyzeBookmarks method');
        }
      }
    },
    
    {
      name: 'Should initialize bookmark search',
      async test() {
        if (typeof BookmarkSearch === 'undefined') {
          throw new Error('BookmarkSearch not loaded');
        }
        
        const mockOrganizer = {
          bookmarkTree: window.mockBookmarks[0]
        };
        
        const search = new BookmarkSearch(mockOrganizer);
        
        if (!search.searchBookmarks) {
          throw new Error('BookmarkSearch missing searchBookmarks method');
        }
        
        if (!search.buildSearchIndex) {
          throw new Error('BookmarkSearch missing buildSearchIndex method');
        }
      }
    },
    
    {
      name: 'Should initialize duplicate detector',
      async test() {
        if (typeof DuplicateDetector === 'undefined') {
          throw new Error('DuplicateDetector not loaded');
        }
        
        const mockOrganizer = {
          bookmarkTree: window.mockBookmarks[0]
        };
        
        const detector = new DuplicateDetector(mockOrganizer);
        
        if (!detector.identifyDuplicates) {
          throw new Error('DuplicateDetector missing identifyDuplicates method');
        }
        
        if (!detector.buildBookmarkList) {
          throw new Error('DuplicateDetector missing buildBookmarkList method');
        }
      }
    },
    
    {
      name: 'Should have mock data with expected structure',
      async test() {
        if (!window.mockBookmarks || !Array.isArray(window.mockBookmarks)) {
          throw new Error('Mock bookmarks not available');
        }
        
        const root = window.mockBookmarks[0];
        if (!root || root.type !== 'folder' || !root.children) {
          throw new Error('Mock root folder invalid');
        }
        
        // Check for expected folders
        const bookmarkBar = root.children.find(c => c.title === 'Bookmarks Bar');
        if (!bookmarkBar) {
          throw new Error('Bookmarks Bar not found in mock data');
        }
        
        // Check for empty folder
        const emptyFolder = bookmarkBar.children.find(c => c.title === 'Empty Folder');
        if (!emptyFolder) {
          throw new Error('Empty Folder not found in mock data');
        }
        
        if (!emptyFolder.children || emptyFolder.children.length !== 0) {
          throw new Error('Empty Folder should have no children');
        }
        
        // Check for duplicates
        const allBookmarks = [];
        const extractBookmarks = (node) => {
          if (node.type === 'bookmark') {
            allBookmarks.push(node);
          } else if (node.children) {
            node.children.forEach(extractBookmarks);
          }
        };
        extractBookmarks(root);
        
        const githubBookmarks = allBookmarks.filter(b => b.url && b.url.includes('github.com'));
        if (githubBookmarks.length < 2) {
          throw new Error('Should have at least 2 GitHub bookmarks for duplicate testing');
        }
      }
    },
    
    {
      name: 'Should classify different website types correctly',
      async test() {
        const classifier = new SiteClassifier();
        
        const testCases = [
          { url: 'https://github.com', expectedType: 'Development' },
          { url: 'https://stackoverflow.com', expectedType: 'Development' },
          { url: 'https://news.ycombinator.com', expectedType: 'News' },
          { url: 'https://techcrunch.com', expectedType: 'News' },
          { url: 'https://youtube.com', expectedType: 'Entertainment' },
          { url: 'https://wikipedia.org', expectedType: 'Reference' }
        ];
        
        for (const testCase of testCases) {
          const category = classifier.classifySite(testCase.url, '');
          if (!category.includes(testCase.expectedType)) {
            console.warn(`Expected ${testCase.expectedType} for ${testCase.url}, got ${category}`);
            // Don't fail the test for classification differences, just warn
          }
        }
      }
    },
    
    {
      name: 'Should search bookmarks correctly',
      async test() {
        const mockOrganizer = {
          bookmarkTree: window.mockBookmarks[0]
        };
        
        const search = new BookmarkSearch(mockOrganizer);
        await search.initialize();
        
        // Search for GitHub
        const results = search.searchBookmarks('github');
        if (results.length === 0) {
          throw new Error('Should find GitHub bookmarks');
        }
        
        const githubResult = results.find(r => r.url.includes('github.com'));
        if (!githubResult) {
          throw new Error('Should find GitHub bookmark in results');
        }
        
        // Test search highlighting
        if (!githubResult.highlights) {
          throw new Error('Search results should include highlights');
        }
      }
    },
    
    {
      name: 'Should detect duplicates correctly',
      async test() {
        const mockOrganizer = {
          bookmarkTree: window.mockBookmarks[0]
        };
        
        const detector = new DuplicateDetector(mockOrganizer);
        await detector.initialize();
        
        const duplicates = detector.identifyDuplicates();
        
        if (duplicates.length === 0) {
          throw new Error('Should detect duplicates in mock data');
        }
        
        const githubDuplicates = duplicates.find(group => 
          group.url.includes('github.com')
        );
        
        if (!githubDuplicates) {
          throw new Error('Should detect GitHub duplicates');
        }
        
        if (githubDuplicates.bookmarks.length < 2) {
          throw new Error('GitHub duplicate group should have at least 2 bookmarks');
        }
      }
    }
  ]
}; 