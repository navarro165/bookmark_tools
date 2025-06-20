// Integration tests for the complete system
const IntegrationTests = {
  name: 'Integration Tests',
  
  tests: [
    {
      name: 'Should categorize and organize bookmarks end-to-end',
      async test() {
        // Clear storage
        await browser.storage.local.clear();
        
        // Create instances
        const classifier = new SiteClassifier();
        const analyzer = new ContentAnalyzer();
        
        // Test bookmarks
        const bookmarks = [
          { url: 'https://github.com/user/repo', title: 'My GitHub Repo' },
          { url: 'https://unknown-blog.com/post/123', title: 'Interesting Blog Post' },
          { url: 'https://shop.example.com/products', title: 'Buy Our Products' }
        ];
        
        // Classify each bookmark
        const results = [];
        for (const bookmark of bookmarks) {
          const category = classifier.classifySite(bookmark.url, bookmark.title);
          results.push({ bookmark, category });
        }
        
        // Verify categorization
        if (!results[0].category.includes('Development')) {
          throw new Error('GitHub should be categorized as Development');
        }
        
        if (!results[1].category.includes('Reading/Blogs')) {
          throw new Error('Blog should be categorized correctly');
        }
        
        if (!results[2].category.includes('Shopping')) {
          throw new Error('Shop should be categorized as Shopping');
        }
      }
    },
    
    {
      name: 'Should handle unknown sites with content analysis',
      async test() {
        const classifier = new SiteClassifier();
        const analyzer = new ContentAnalyzer();
        
        const unknownBookmarks = [
          { 
            url: 'https://random-site-12345.com/api/docs', 
            title: 'API Documentation - Random Site' 
          }
        ];
        
        // Analyze unknown sites
        const analysisResults = await analyzer.analyzeBookmarks(
          unknownBookmarks,
          () => {} // Progress callback
        );
        
        if (analysisResults.length === 0) {
          throw new Error('Should analyze unknown sites');
        }
        
        const result = analysisResults[0];
        if (!result.category.includes('Development')) {
          throw new Error('Should detect development site from URL pattern');
        }
      }
    },
    
    {
      name: 'Should find and handle duplicates correctly',
      async test() {
        const mockOrganizer = {
          bookmarkTree: window.mockBookmarks[0]
        };
        
        const detector = new DuplicateDetector(mockOrganizer);
        await detector.initialize();
        
        const duplicates = detector.identifyDuplicates();
        
        // Should find GitHub duplicates
        const githubGroup = duplicates.find(g => g.url.includes('github.com'));
        if (!githubGroup || githubGroup.bookmarks.length < 2) {
          throw new Error('Should find GitHub duplicates');
        }
        
        // Simulate user selection (keep only the first one)
        githubGroup.selectedToKeep = new Set([githubGroup.bookmarks[0].id]);
        
        // Verify selection
        const toDelete = githubGroup.bookmarks.filter(b => 
          !githubGroup.selectedToKeep.has(b.id)
        );
        
        if (toDelete.length !== githubGroup.bookmarks.length - 1) {
          throw new Error('Should mark all but one for deletion');
        }
      }
    },
    
    {
      name: 'Should search bookmarks with relevance scoring',
      async test() {
        const mockOrganizer = {
          bookmarkTree: window.mockBookmarks[0]
        };
        
        const search = new BookmarkSearch(mockOrganizer);
        await search.initialize();
        
        // Search for development-related bookmarks
        const results = search.searchBookmarks('development');
        
        if (results.length === 0) {
          throw new Error('Should find development bookmarks');
        }
        
        // GitHub should be highly relevant
        const githubResult = results.find(r => r.url.includes('github.com'));
        if (!githubResult) {
          throw new Error('Should find GitHub in development search');
        }
        
        // Should have high score due to path match
        if (githubResult.score < 50) {
          throw new Error('GitHub should have high relevance score for development search');
        }
      }
    },
    
    {
      name: 'Should persist and restore user customizations',
      async test() {
        await browser.storage.local.clear();
        
        const classifier1 = new SiteClassifier();
        
        // Add custom classifications
        await classifier1.learnFromUserAction('https://mycompany.com', 'Work/Internal');
        await classifier1.learnFromUserAction('https://personal-site.com', 'Personal/Projects');
        
        // Export data
        const exportedData = await classifier1.exportUserData();
        
        // Create new instance (simulating restart)
        await browser.storage.local.clear();
        const classifier2 = new SiteClassifier();
        
        // Import data
        await classifier2.importUserData(exportedData);
        
        // Verify persistence
        const result1 = classifier2.classifySite('https://mycompany.com');
        const result2 = classifier2.classifySite('https://personal-site.com');
        
        if (result1 !== 'Work/Internal' || result2 !== 'Personal/Projects') {
          throw new Error('User customizations not persisted correctly');
        }
      }
    },
    
    {
      name: 'Should handle edge cases gracefully',
      async test() {
        const classifier = new SiteClassifier();
        const analyzer = new ContentAnalyzer();
        
        // Test invalid URLs
        const invalidUrl = 'not-a-url';
        const category1 = classifier.classifySite(invalidUrl);
        if (!category1.includes('Other/Invalid')) {
          throw new Error('Should handle invalid URLs');
        }
        
        // Test empty title
        const category2 = classifier.classifySite('https://example.com', '');
        if (!category2) {
          throw new Error('Should handle empty titles');
        }
        
        // Test very long URL
        const longUrl = 'https://example.com/' + 'a'.repeat(1000);
        const category3 = classifier.classifySite(longUrl);
        if (!category3) {
          throw new Error('Should handle very long URLs');
        }
      }
    },
    
    {
      name: 'Should detect empty folders correctly',
      async test() {
        // Mock organizer with empty folder structure
        const mockBookmarkTree = {
          id: '0',
          type: 'folder',
          title: '',
          children: [
            {
              id: '1',
              type: 'folder',
              title: 'Has Content',
              children: [
                { id: '10', type: 'bookmark', title: 'Test', url: 'https://test.com' }
              ]
            },
            {
              id: '2',
              type: 'folder',
              title: 'Empty Parent',
              children: [
                {
                  id: '20',
                  type: 'folder',
                  title: 'Empty Child',
                  children: []
                }
              ]
            },
            {
              id: '3',
              type: 'folder',
              title: 'Completely Empty',
              children: []
            }
          ]
        };
        
        // Create a minimal mock organizer for testing
        const folderHasContent = function(node) {
          if (!node.children || node.children.length === 0) return false;
          
          return node.children.some(child => 
            child.type === 'bookmark' || 
            (child.type === 'folder' && folderHasContent(child))
          );
        };
        
        const emptyFolders = [];
        const checkFolder = (node, path = '') => {
          if (node.type === 'folder' && node.id !== '0') {
            const currentPath = path ? `${path} > ${node.title}` : node.title;
            
            const hasContent = node.children && node.children.some(child => 
              child.type === 'bookmark' || 
              (child.type === 'folder' && folderHasContent(child))
            );
            
            if (!hasContent) {
              emptyFolders.push({
                id: node.id,
                title: node.title,
                path: currentPath
              });
            }
          }
          
          if (node.children) {
            const currentPath = path ? `${path} > ${node.title}` : node.title;
            node.children.forEach(child => checkFolder(child, currentPath));
          }
        };
        
        checkFolder(mockBookmarkTree);
        
        // Should find 3 empty folders
        if (emptyFolders.length !== 3) {
          throw new Error(`Expected 3 empty folders, found ${emptyFolders.length}`);
        }
        
        // Verify correct folders were identified
        const emptyTitles = emptyFolders.map(f => f.title).sort();
        const expectedTitles = ['Empty Parent', 'Empty Child', 'Completely Empty'].sort();
        
        if (JSON.stringify(emptyTitles) !== JSON.stringify(expectedTitles)) {
          throw new Error('Incorrect empty folders detected');
        }
      }
    }
  ]
}; 