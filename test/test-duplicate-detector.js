// Tests for DuplicateDetector
const DuplicateDetectorTests = {
  name: 'DuplicateDetector Tests',
  
  tests: [
    {
      name: 'Should initialize and build bookmark list',
      async test() {
        const mockOrganizer = {
          bookmarkTree: window.mockBookmarks[0]
        };
        
        const detector = new DuplicateDetector(mockOrganizer);
        await detector.initialize();
        
        if (detector.allBookmarks.length === 0) {
          throw new Error('No bookmarks found');
        }
        
        // Should include all bookmarks from mock data
        const githubBookmarks = detector.allBookmarks.filter(b => b.url.includes('github.com'));
        if (githubBookmarks.length < 2) {
          throw new Error('Should find duplicate GitHub bookmarks');
        }
      }
    },
    
    {
      name: 'Should identify duplicates correctly',
      async test() {
        const mockOrganizer = {
          bookmarkTree: window.mockBookmarks[0]
        };
        
        const detector = new DuplicateDetector(mockOrganizer);
        await detector.initialize();
        
        const duplicates = detector.identifyDuplicates();
        
        if (duplicates.length === 0) {
          throw new Error('No duplicates found');
        }
        
        // Should find GitHub duplicates
        const githubDuplicates = duplicates.find(group => 
          group.url.includes('github.com')
        );
        
        if (!githubDuplicates) {
          throw new Error('GitHub duplicates not found');
        }
        
        if (githubDuplicates.bookmarks.length < 2) {
          throw new Error('Should have at least 2 GitHub bookmarks in duplicate group');
        }
      }
    },
    
    {
      name: 'Should normalize URLs correctly',
      async test() {
        const mockOrganizer = { bookmarkTree: { children: [] } };
        const detector = new DuplicateDetector(mockOrganizer);
        
        const testCases = [
          { url: 'https://github.com', expected: 'https://github.com' },
          { url: '  https://github.com  ', expected: 'https://github.com' },
          { url: 'https://github.com?param=value', expected: 'https://github.com?param=value' }
        ];
        
        for (const testCase of testCases) {
          const normalized = detector.normalizeUrl(testCase.url);
          if (normalized !== testCase.expected) {
            throw new Error(`Expected ${testCase.expected}, got ${normalized}`);
          }
        }
      }
    },
    
    {
      name: 'Should sort duplicates by date and title',
      async test() {
        const mockOrganizer = {
          bookmarkTree: window.mockBookmarks[0]
        };
        
        const detector = new DuplicateDetector(mockOrganizer);
        await detector.initialize();
        
        const duplicates = detector.identifyDuplicates();
        const githubGroup = duplicates.find(g => g.url.includes('github.com'));
        
        if (!githubGroup) {
          throw new Error('GitHub duplicates not found');
        }
        
        // First bookmark should be the newest
        const dates = githubGroup.bookmarks.map(b => b.dateAdded);
        for (let i = 1; i < dates.length; i++) {
          if (dates[i] > dates[i-1]) {
            throw new Error('Bookmarks not sorted by date (newest first)');
          }
        }
      }
    },
    
    {
      name: 'Should set default selection correctly',
      async test() {
        const mockOrganizer = {
          bookmarkTree: window.mockBookmarks[0]
        };
        
        const detector = new DuplicateDetector(mockOrganizer);
        await detector.initialize();
        
        const duplicates = detector.identifyDuplicates();
        
        for (const group of duplicates) {
          if (group.selectedToKeep.size !== 1) {
            throw new Error('Should select exactly one bookmark by default');
          }
          
          // Should select the first (newest/best) bookmark
          const firstId = group.bookmarks[0].id;
          if (!group.selectedToKeep.has(firstId)) {
            throw new Error('Should select the first bookmark by default');
          }
        }
      }
    },
    
    {
      name: 'Should handle empty folders correctly',
      async test() {
        const mockOrganizer = {
          bookmarkTree: {
            id: '0',
            type: 'folder',
            children: [
              {
                id: '1',
                type: 'folder',
                title: 'Empty',
                children: []
              }
            ]
          }
        };
        
        const detector = new DuplicateDetector(mockOrganizer);
        await detector.initialize();
        
        const duplicates = detector.identifyDuplicates();
        
        if (duplicates.length !== 0) {
          throw new Error('Should not find duplicates in empty folders');
        }
      }
    },
    
    {
      name: 'Should extract all bookmarks recursively',
      async test() {
        const mockOrganizer = {
          bookmarkTree: window.mockBookmarks[0]
        };
        
        const detector = new DuplicateDetector(mockOrganizer);
        detector.extractAllBookmarks(mockOrganizer.bookmarkTree, '');
        
        // Should find bookmarks in nested folders
        const devBookmark = detector.allBookmarks.find(b => 
          b.path.includes('Development')
        );
        
        if (!devBookmark) {
          throw new Error('Should find bookmarks in nested folders');
        }
        
        // Should have correct path
        if (!devBookmark.path.includes('Bookmarks Bar > Development')) {
          throw new Error('Path not constructed correctly');
        }
      }
    },
    
    {
      name: 'Should handle bookmarks without URLs',
      async test() {
        const mockOrganizer = {
          bookmarkTree: {
            id: '0',
            type: 'folder',
            children: [
              {
                id: '1',
                type: 'bookmark',
                title: 'No URL Bookmark',
                url: ''
              },
              {
                id: '2',
                type: 'bookmark',
                title: 'Another No URL',
                url: ''
              }
            ]
          }
        };
        
        const detector = new DuplicateDetector(mockOrganizer);
        await detector.initialize();
        
        const duplicates = detector.identifyDuplicates();
        
        // Should not crash and should not consider empty URLs as duplicates
        if (duplicates.length > 0) {
          const emptyUrlGroup = duplicates.find(g => g.url === '');
          if (emptyUrlGroup) {
            throw new Error('Should not group bookmarks with empty URLs as duplicates');
          }
        }
      }
    },
    
    {
      name: 'Should escape HTML correctly',
      async test() {
        const mockOrganizer = { bookmarkTree: { children: [] } };
        const detector = new DuplicateDetector(mockOrganizer);
        
        const escaped = detector.escapeHtml('<script>alert("xss")</script>');
        
        if (escaped.includes('<script>')) {
          throw new Error('HTML not escaped');
        }
        
        if (!escaped.includes('&lt;script&gt;')) {
          throw new Error('HTML entities not created correctly');
        }
      }
    }
  ]
}; 