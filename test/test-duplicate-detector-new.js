// Modern tests for DuplicateDetector
const DuplicateDetectorNewTests = {
  name: 'DuplicateDetector (New Implementation) Tests',
  
  tests: [
    {
      name: 'Should initialize correctly',
      async test() {
        const mockOrganizer = { 
          bookmarkTree: null,
          showStatus: () => {},
          scrollToElement: () => {}
        };
        
        const detector = new DuplicateDetector(mockOrganizer);
        
        if (detector.organizer !== mockOrganizer) {
          throw new Error('Organizer not set correctly');
        }
        
        if (!Array.isArray(detector.allBookmarks)) {
          throw new Error('allBookmarks should be an array');
        }
        
        if (!Array.isArray(detector.duplicateGroups)) {
          throw new Error('duplicateGroups should be an array');
        }
        
        if (!(detector.selectedToKeep instanceof Map)) {
          throw new Error('selectedToKeep should be a Map');
        }
        
        if (detector.isAnalyzing !== false) {
          throw new Error('isAnalyzing should start as false');
        }
      }
    },
    
    {
      name: 'Should extract all bookmarks correctly',
      async test() {
        const mockOrganizer = {
          bookmarkTree: {
            id: '0',
            type: 'folder',
            title: 'Root',
            children: [
              {
                id: '1',
                type: 'folder',
                title: 'Work',
                children: [
                  {
                    id: '10',
                    type: 'bookmark',
                    title: 'Project Site',
                    url: 'https://project.example.com',
                    dateAdded: Date.now() - 86400000,
                    parentId: '1'
                  },
                  {
                    id: '11',
                    type: 'bookmark',
                    title: 'Another Site',
                    url: 'https://other.example.com',
                    dateAdded: Date.now() - 172800000,
                    parentId: '1'
                  }
                ]
              },
              {
                id: '2',
                type: 'folder',
                title: 'Personal',
                children: [
                  {
                    id: '20',
                    type: 'bookmark',
                    title: 'Personal Site',
                    url: 'https://personal.example.com',
                    dateAdded: Date.now() - 259200000,
                    parentId: '2'
                  }
                ]
              }
            ]
          }
        };
        
        const detector = new DuplicateDetector(mockOrganizer);
        await detector.initialize();
        
        if (detector.allBookmarks.length !== 3) {
          throw new Error(`Expected 3 bookmarks, got ${detector.allBookmarks.length}`);
        }
        
        // Check bookmark structure
        const firstBookmark = detector.allBookmarks[0];
        if (!firstBookmark.id || !firstBookmark.title || !firstBookmark.url || !firstBookmark.path) {
          throw new Error('Bookmark missing required fields');
        }
        
        // Check path construction
        const workBookmark = detector.allBookmarks.find(b => b.parentId === '1');
        if (workBookmark.path !== 'Work') {
          throw new Error(`Expected path 'Work', got '${workBookmark.path}'`);
        }
      }
    },
    
    {
      name: 'Should normalize URLs correctly',
      async test() {
        const mockOrganizer = { bookmarkTree: null };
        const detector = new DuplicateDetector(mockOrganizer);
        
        const testCases = [
          {
            input: 'https://example.com/page',
            expected: 'https://example.com/page'
          },
          {
            input: '  https://example.com/page  ',
            expected: 'https://example.com/page'
          },
          {
            input: 'https://example.com/page?query=value&sort=name',
            expected: 'https://example.com/page?query=value&sort=name'
          },
          {
            input: 'invalid-url',
            expected: 'invalid-url'
          }
        ];
        
        for (const testCase of testCases) {
          const normalized = detector.normalizeUrl(testCase.input);
          if (normalized !== testCase.expected) {
            throw new Error(`Expected '${testCase.expected}', got '${normalized}'`);
          }
        }
      }
    },
    
    {
      name: 'Should identify exact URL duplicates',
      async test() {
        const mockOrganizer = {
          bookmarkTree: {
            id: '0',
            type: 'folder',
            children: [
              {
                id: '10',
                type: 'bookmark',
                title: 'GitHub Repository',
                url: 'https://github.com/user/repo',
                dateAdded: Date.now() - 86400000,
                parentId: '0'
              },
              {
                id: '11',
                type: 'bookmark',
                title: 'GitHub Repo (Duplicate)',
                url: 'https://github.com/user/repo',
                dateAdded: Date.now() - 172800000,
                parentId: '0'
              },
              {
                id: '12',
                type: 'bookmark',
                title: 'Different Site',
                url: 'https://different.example.com',
                dateAdded: Date.now() - 259200000,
                parentId: '0'
              },
              {
                id: '13',
                type: 'bookmark',
                title: 'Another GitHub Duplicate',
                url: 'https://github.com/user/repo',
                dateAdded: Date.now() - 345600000,
                parentId: '0'
              }
            ]
          }
        };
        
        const detector = new DuplicateDetector(mockOrganizer);
        await detector.initialize();
        
        const duplicateGroups = detector.identifyDuplicates();
        
        if (duplicateGroups.length !== 1) {
          throw new Error(`Expected 1 duplicate group, got ${duplicateGroups.length}`);
        }
        
        const group = duplicateGroups[0];
        if (group.bookmarks.length !== 3) {
          throw new Error(`Expected 3 duplicates in group, got ${group.bookmarks.length}`);
        }
        
        if (group.url !== 'https://github.com/user/repo') {
          throw new Error(`Expected group URL 'https://github.com/user/repo', got '${group.url}'`);
        }
      }
    },
    
    {
      name: 'Should sort duplicates by date and title',
      async test() {
        const now = Date.now();
        const mockOrganizer = {
          bookmarkTree: {
            id: '0',
            type: 'folder',
            children: [
              {
                id: '10',
                type: 'bookmark',
                title: 'Short Title',
                url: 'https://example.com',
                dateAdded: now - 172800000, // Older
                parentId: '0'
              },
              {
                id: '11',
                type: 'bookmark',
                title: 'Much Longer and More Descriptive Title',
                url: 'https://example.com',
                dateAdded: now - 86400000, // Newer
                parentId: '0'
              },
              {
                id: '12',
                type: 'bookmark',
                title: 'Another Long Title for Testing',
                url: 'https://example.com',
                dateAdded: now - 86400000, // Same date as above
                parentId: '0'
              }
            ]
          }
        };
        
        const detector = new DuplicateDetector(mockOrganizer);
        await detector.initialize();
        
        const duplicateGroups = detector.identifyDuplicates();
        const group = duplicateGroups[0];
        
        // Should be sorted by date (newer first), then by title length (longer first)
        if (group.bookmarks[0].id !== '11') {
          throw new Error('First bookmark should be the newer one with longer title');
        }
        
        // Default selection should be the first (best) bookmark
        if (!group.selectedToKeep.has('11')) {
          throw new Error('Best bookmark should be selected by default');
        }
        
        if (group.selectedToKeep.size !== 1) {
          throw new Error('Only one bookmark should be selected by default');
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
                id: '10',
                type: 'bookmark',
                title: 'Bookmark with URL',
                url: 'https://example.com',
                parentId: '0'
              },
              {
                id: '11',
                type: 'bookmark',
                title: 'Bookmark without URL',
                url: '', // Empty URL
                parentId: '0'
              },
              {
                id: '12',
                type: 'bookmark',
                title: 'Another bookmark without URL',
                // No url property
                parentId: '0'
              }
            ]
          }
        };
        
        const detector = new DuplicateDetector(mockOrganizer);
        await detector.initialize();
        
        const duplicateGroups = detector.identifyDuplicates();
        
        // Should not find duplicates among bookmarks without URLs
        if (duplicateGroups.length !== 0) {
          throw new Error('Should not find duplicates for bookmarks without URLs');
        }
      }
    },
    
    {
      name: 'Should handle empty bookmark tree',
      async test() {
        const mockOrganizer = {
          bookmarkTree: {
            id: '0',
            type: 'folder',
            children: []
          }
        };
        
        const detector = new DuplicateDetector(mockOrganizer);
        await detector.initialize();
        
        if (detector.allBookmarks.length !== 0) {
          throw new Error('Should have no bookmarks for empty tree');
        }
        
        const duplicateGroups = detector.identifyDuplicates();
        
        if (duplicateGroups.length !== 0) {
          throw new Error('Should find no duplicates in empty tree');
        }
      }
    },
    
    {
      name: 'Should handle query parameters in URLs',
      async test() {
        const mockOrganizer = {
          bookmarkTree: {
            id: '0',
            type: 'folder',
            children: [
              {
                id: '10',
                type: 'bookmark',
                title: 'Search Result 1',
                url: 'https://example.com/search?q=javascript&sort=date',
                parentId: '0'
              },
              {
                id: '11',
                type: 'bookmark',
                title: 'Search Result 2',
                url: 'https://example.com/search?q=javascript&sort=date',
                parentId: '0'
              },
              {
                id: '12',
                type: 'bookmark',
                title: 'Different Search',
                url: 'https://example.com/search?q=python&sort=date',
                parentId: '0'
              }
            ]
          }
        };
        
        const detector = new DuplicateDetector(mockOrganizer);
        await detector.initialize();
        
        const duplicateGroups = detector.identifyDuplicates();
        
        if (duplicateGroups.length !== 1) {
          throw new Error(`Expected 1 duplicate group, got ${duplicateGroups.length}`);
        }
        
        const group = duplicateGroups[0];
        if (group.bookmarks.length !== 2) {
          throw new Error(`Expected 2 duplicates, got ${group.bookmarks.length}`);
        }
        
        // Should match exact URLs including query parameters
        if (group.url !== 'https://example.com/search?q=javascript&sort=date') {
          throw new Error('Should preserve exact URL with query parameters');
        }
      }
    },
    
    {
      name: 'Should handle multiple duplicate groups',
      async test() {
        const mockOrganizer = {
          bookmarkTree: {
            id: '0',
            type: 'folder',
            children: [
              {
                id: '10',
                type: 'bookmark',
                title: 'GitHub 1',
                url: 'https://github.com/user/repo1',
                parentId: '0'
              },
              {
                id: '11',
                type: 'bookmark',
                title: 'GitHub 2',
                url: 'https://github.com/user/repo1',
                parentId: '0'
              },
              {
                id: '12',
                type: 'bookmark',
                title: 'Stack Overflow 1',
                url: 'https://stackoverflow.com/questions/123',
                parentId: '0'
              },
              {
                id: '13',
                type: 'bookmark',
                title: 'Stack Overflow 2',
                url: 'https://stackoverflow.com/questions/123',
                parentId: '0'
              },
              {
                id: '14',
                type: 'bookmark',
                title: 'Unique Site',
                url: 'https://unique.example.com',
                parentId: '0'
              }
            ]
          }
        };
        
        const detector = new DuplicateDetector(mockOrganizer);
        await detector.initialize();
        
        const duplicateGroups = detector.identifyDuplicates();
        
        if (duplicateGroups.length !== 2) {
          throw new Error(`Expected 2 duplicate groups, got ${duplicateGroups.length}`);
        }
        
        // Check both groups have 2 bookmarks each
        const group1 = duplicateGroups.find(g => g.url.includes('github.com'));
        const group2 = duplicateGroups.find(g => g.url.includes('stackoverflow.com'));
        
        if (!group1 || !group2) {
          throw new Error('Should find both GitHub and Stack Overflow duplicate groups');
        }
        
        if (group1.bookmarks.length !== 2 || group2.bookmarks.length !== 2) {
          throw new Error('Each group should have 2 bookmarks');
        }
      }
    },
    
    {
      name: 'Should escape HTML in output',
      async test() {
        const mockOrganizer = { bookmarkTree: null };
        const detector = new DuplicateDetector(mockOrganizer);
        
        const escaped = detector.escapeHtml('<script>alert("xss")</script>');
        
        if (escaped.includes('<script>') || escaped.includes('</script>')) {
          throw new Error('Should escape HTML tags');
        }
        
        if (!escaped.includes('&lt;') || !escaped.includes('&gt;')) {
          throw new Error('Should convert to HTML entities');
        }
      }
    },
    
    {
      name: 'Should handle null or undefined text in escapeHtml',
      async test() {
        const mockOrganizer = { bookmarkTree: null };
        const detector = new DuplicateDetector(mockOrganizer);
        
        const escaped1 = detector.escapeHtml(null);
        const escaped2 = detector.escapeHtml(undefined);
        const escaped3 = detector.escapeHtml('');
        
        if (escaped1 !== '' || escaped2 !== '' || escaped3 !== '') {
          throw new Error('Should handle null/undefined/empty text gracefully');
        }
      }
    },
    
    {
      name: 'Should maintain folder path information',
      async test() {
        const mockOrganizer = {
          bookmarkTree: {
            id: '0',
            type: 'folder',
            title: 'Root',
            children: [
              {
                id: '1',
                type: 'folder',
                title: 'Work',
                children: [
                  {
                    id: '2',
                    type: 'folder',
                    title: 'Projects',
                    children: [
                      {
                        id: '10',
                        type: 'bookmark',
                        title: 'Project Alpha',
                        url: 'https://example.com/project',
                        parentId: '2'
                      }
                    ]
                  }
                ]
              },
              {
                id: '3',
                type: 'folder',
                title: 'Personal',
                children: [
                  {
                    id: '11',
                    type: 'bookmark',
                    title: 'Personal Project',
                    url: 'https://example.com/project',
                    parentId: '3'
                  }
                ]
              }
            ]
          }
        };
        
        const detector = new DuplicateDetector(mockOrganizer);
        await detector.initialize();
        
        const duplicateGroups = detector.identifyDuplicates();
        
        if (duplicateGroups.length !== 1) {
          throw new Error(`Expected 1 duplicate group, got ${duplicateGroups.length}`);
        }
        
        const group = duplicateGroups[0];
        const workBookmark = group.bookmarks.find(b => b.id === '10');
        const personalBookmark = group.bookmarks.find(b => b.id === '11');
        
        if (workBookmark.path !== 'Work > Projects') {
          throw new Error(`Expected 'Work > Projects', got '${workBookmark.path}'`);
        }
        
        if (personalBookmark.path !== 'Personal') {
          throw new Error(`Expected 'Personal', got '${personalBookmark.path}'`);
        }
      }
    },
    
    {
      name: 'Should handle bookmarks with same URL but different fragments',
      async test() {
        const mockOrganizer = {
          bookmarkTree: {
            id: '0',
            type: 'folder',
            children: [
              {
                id: '10',
                type: 'bookmark',
                title: 'Page Section 1',
                url: 'https://example.com/page#section1',
                parentId: '0'
              },
              {
                id: '11',
                type: 'bookmark',
                title: 'Page Section 2',
                url: 'https://example.com/page#section2',
                parentId: '0'
              },
              {
                id: '12',
                type: 'bookmark',
                title: 'Same Page Different Section',
                url: 'https://example.com/page#section1',
                parentId: '0'
              }
            ]
          }
        };
        
        const detector = new DuplicateDetector(mockOrganizer);
        await detector.initialize();
        
        const duplicateGroups = detector.identifyDuplicates();
        
        if (duplicateGroups.length !== 1) {
          throw new Error(`Expected 1 duplicate group, got ${duplicateGroups.length}`);
        }
        
        const group = duplicateGroups[0];
        if (group.bookmarks.length !== 2) {
          throw new Error(`Expected 2 duplicates for exact URL match, got ${group.bookmarks.length}`);
        }
        
        if (group.url !== 'https://example.com/page#section1') {
          throw new Error('Should preserve exact URL with fragment');
        }
      }
    },
    
    {
      name: 'Should handle case-sensitive URL matching',
      async test() {
        const mockOrganizer = {
          bookmarkTree: {
            id: '0',
            type: 'folder',
            children: [
              {
                id: '10',
                type: 'bookmark',
                title: 'Lowercase Path',
                url: 'https://example.com/path/file',
                parentId: '0'
              },
              {
                id: '11',
                type: 'bookmark',
                title: 'Uppercase Path',
                url: 'https://example.com/Path/File',
                parentId: '0'
              },
              {
                id: '12',
                type: 'bookmark',
                title: 'Exact Duplicate',
                url: 'https://example.com/path/file',
                parentId: '0'
              }
            ]
          }
        };
        
        const detector = new DuplicateDetector(mockOrganizer);
        await detector.initialize();
        
        const duplicateGroups = detector.identifyDuplicates();
        
        if (duplicateGroups.length !== 1) {
          throw new Error('Should find exactly one duplicate group for exact URL matches');
        }
        
        const group = duplicateGroups[0];
        if (group.bookmarks.length !== 2) {
          throw new Error('Should find 2 bookmarks with exact URL match');
        }
        
        // Should match the exact lowercase URL
        if (group.url !== 'https://example.com/path/file') {
          throw new Error('Should preserve exact URL case');
        }
      }
    }
  ]
}; 