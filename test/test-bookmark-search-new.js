// Modern tests for BookmarkSearch
const BookmarkSearchNewTests = {
  name: 'BookmarkSearch (New Implementation) Tests',
  
  tests: [
    {
      name: 'Should initialize and build search index correctly',
      async test() {
        // Create a mock organizer with bookmark tree
        const mockOrganizer = {
          bookmarkTree: {
            id: '0',
            type: 'folder',
            title: 'Root',
            children: [
              {
                id: '1',
                type: 'folder',
                title: 'Development',
                children: [
                  {
                    id: '10',
                    type: 'bookmark',
                    title: 'GitHub - JavaScript Projects',
                    url: 'https://github.com/user/repo',
                    dateAdded: Date.now() - 86400000,
                    parentId: '1'
                  },
                  {
                    id: '11',
                    type: 'bookmark',
                    title: 'Stack Overflow - Programming Q&A',
                    url: 'https://stackoverflow.com/questions',
                    dateAdded: Date.now() - 172800000,
                    parentId: '1'
                  }
                ]
              }
            ]
          }
        };
        
        const bookmarkSearch = new BookmarkSearch(mockOrganizer);
        await bookmarkSearch.initialize();
        
        if (bookmarkSearch.allBookmarks.length !== 2) {
          throw new Error(`Expected 2 bookmarks, got ${bookmarkSearch.allBookmarks.length}`);
        }
        
        if (bookmarkSearch.searchIndex.size !== 2) {
          throw new Error(`Expected search index size 2, got ${bookmarkSearch.searchIndex.size}`);
        }
        
        // Verify bookmark data structure
        const firstBookmark = bookmarkSearch.allBookmarks[0];
        if (!firstBookmark.title || !firstBookmark.url || !firstBookmark.path) {
          throw new Error('Bookmark missing required fields');
        }
      }
    },
    
    {
      name: 'Should extract bookmarks with correct paths',
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
                        url: 'https://alpha.example.com',
                        parentId: '2'
                      }
                    ]
                  }
                ]
              }
            ]
          }
        };
        
        const bookmarkSearch = new BookmarkSearch(mockOrganizer);
        await bookmarkSearch.initialize();
        
        const bookmark = bookmarkSearch.allBookmarks[0];
        if (bookmark.path !== 'Work > Projects') {
          throw new Error(`Expected path 'Work > Projects', got '${bookmark.path}'`);
        }
      }
    },
    
    {
      name: 'Should tokenize text correctly',
      async test() {
        const mockOrganizer = { bookmarkTree: null };
        const bookmarkSearch = new BookmarkSearch(mockOrganizer);
        
        const tokens = bookmarkSearch.tokenize('JavaScript Programming: A Complete Guide!');
        const expectedTokens = ['javascript', 'programming', 'a', 'complete', 'guide'];
        
        if (tokens.length !== expectedTokens.length) {
          throw new Error(`Expected ${expectedTokens.length} tokens, got ${tokens.length}`);
        }
        
        for (let i = 0; i < expectedTokens.length; i++) {
          if (tokens[i] !== expectedTokens[i]) {
            throw new Error(`Expected token '${expectedTokens[i]}', got '${tokens[i]}'`);
          }
        }
      }
    },
    
    {
      name: 'Should extract domain from URL correctly',
      async test() {
        const mockOrganizer = { bookmarkTree: null };
        const bookmarkSearch = new BookmarkSearch(mockOrganizer);
        
        const testCases = [
          { url: 'https://www.github.com/user/repo', expected: 'github.com' },
          { url: 'https://stackoverflow.com/questions/123', expected: 'stackoverflow.com' },
          { url: 'http://docs.python.org/3/', expected: 'docs.python.org' },
          { url: 'invalid-url', expected: '' }
        ];
        
        for (const testCase of testCases) {
          const domain = bookmarkSearch.extractDomain(testCase.url);
          if (domain !== testCase.expected) {
            throw new Error(`Expected domain '${testCase.expected}' for URL '${testCase.url}', got '${domain}'`);
          }
        }
      }
    },
    
    {
      name: 'Should extract keywords correctly',
      async test() {
        const mockOrganizer = { bookmarkTree: null };
        const bookmarkSearch = new BookmarkSearch(mockOrganizer);
        
        const keywords = bookmarkSearch.extractKeywords('The JavaScript Programming Guide and Tutorial');
        
        // Should exclude common words and short words
        if (keywords.includes('the') || keywords.includes('and')) {
          throw new Error('Should exclude common words');
        }
        
        if (!keywords.includes('javascript') || !keywords.includes('programming')) {
          throw new Error('Should include meaningful keywords');
        }
      }
    },
    
    {
      name: 'Should perform basic search correctly',
      async test() {
        const mockOrganizer = {
          bookmarkTree: {
            id: '0',
            type: 'folder',
            children: [
              {
                id: '1',
                type: 'folder',
                title: 'Tech',
                children: [
                  {
                    id: '10',
                    type: 'bookmark',
                    title: 'GitHub JavaScript Repository',
                    url: 'https://github.com/user/js-repo',
                    parentId: '1'
                  },
                  {
                    id: '11',
                    type: 'bookmark',
                    title: 'Python Documentation',
                    url: 'https://docs.python.org',
                    parentId: '1'
                  }
                ]
              }
            ]
          }
        };
        
        const bookmarkSearch = new BookmarkSearch(mockOrganizer);
        await bookmarkSearch.initialize();
        
        const results = bookmarkSearch.searchBookmarks('javascript');
        
        if (results.length !== 1) {
          throw new Error(`Expected 1 search result, got ${results.length}`);
        }
        
        if (results[0].title !== 'GitHub JavaScript Repository') {
          throw new Error(`Expected 'GitHub JavaScript Repository', got '${results[0].title}'`);
        }
        
        if (results[0].score <= 0) {
          throw new Error('Search result should have positive score');
        }
      }
    },
    
    {
      name: 'Should calculate relevance scores correctly',
      async test() {
        const mockOrganizer = { bookmarkTree: null };
        const bookmarkSearch = new BookmarkSearch(mockOrganizer);
        
        const indexData = {
          bookmark: {
            title: 'JavaScript Programming Guide',
            url: 'https://example.com/js-guide',
            path: 'Development',
            dateAdded: Date.now()
          },
          searchText: 'javascript programming guide example.com development',
          tokens: ['javascript', 'programming', 'guide', 'example', 'com', 'development']
        };
        
        const score = bookmarkSearch.calculateRelevanceScore(indexData, 'javascript', ['javascript']);
        
        if (score <= 0) {
          throw new Error('Should return positive score for matching query');
        }
        
        // Exact match should get higher score than partial match
        const partialScore = bookmarkSearch.calculateRelevanceScore(indexData, 'script', ['script']);
        
        if (score <= partialScore) {
          throw new Error('Exact match should score higher than partial match');
        }
      }
    },
    
    {
      name: 'Should handle search with multiple tokens',
      async test() {
        const mockOrganizer = {
          bookmarkTree: {
            id: '0',
            type: 'folder',
            children: [
              {
                id: '1',
                type: 'folder',
                title: 'Programming',
                children: [
                  {
                    id: '10',
                    type: 'bookmark',
                    title: 'JavaScript React Tutorial',
                    url: 'https://reactjs.org/tutorial',
                    parentId: '1'
                  },
                  {
                    id: '11',
                    type: 'bookmark',
                    title: 'Vue.js Guide',
                    url: 'https://vuejs.org/guide',
                    parentId: '1'
                  }
                ]
              }
            ]
          }
        };
        
        const bookmarkSearch = new BookmarkSearch(mockOrganizer);
        await bookmarkSearch.initialize();
        
        const results = bookmarkSearch.searchBookmarks('javascript react');
        
        if (results.length !== 1) {
          throw new Error(`Expected 1 result for 'javascript react', got ${results.length}`);
        }
        
        if (results[0].title !== 'JavaScript React Tutorial') {
          throw new Error(`Expected 'JavaScript React Tutorial', got '${results[0].title}'`);
        }
      }
    },
    
    {
      name: 'Should find highlights in search results',
      async test() {
        const mockOrganizer = { bookmarkTree: null };
        const bookmarkSearch = new BookmarkSearch(mockOrganizer);
        
        const indexData = {
          bookmark: {
            title: 'JavaScript Programming Guide',
            url: 'https://example.com/js-guide',
            path: 'Development'
          }
        };
        
        const highlights = bookmarkSearch.findHighlights(indexData, 'javascript');
        
        if (!highlights.title.includes('<span class="search-highlight">')) {
          throw new Error('Should highlight matching text in title');
        }
        
        if (!highlights.title.includes('JavaScript')) {
          throw new Error('Should preserve original text case in highlights');
        }
      }
    },
    
    {
      name: 'Should escape HTML correctly',
      async test() {
        const mockOrganizer = { bookmarkTree: null };
        const bookmarkSearch = new BookmarkSearch(mockOrganizer);
        
        const escaped = bookmarkSearch.escapeHtml('<script>alert("xss")</script>');
        
        if (escaped.includes('<script>') || escaped.includes('</script>')) {
          throw new Error('Should escape HTML tags');
        }
        
        if (!escaped.includes('&lt;') || !escaped.includes('&gt;')) {
          throw new Error('Should convert to HTML entities');
        }
      }
    },
    
    {
      name: 'Should escape regex characters correctly',
      async test() {
        const mockOrganizer = { bookmarkTree: null };
        const bookmarkSearch = new BookmarkSearch(mockOrganizer);
        
        const escaped = bookmarkSearch.escapeRegex('test[123].com');
        
        if (!escaped.includes('\\[') || !escaped.includes('\\]') || !escaped.includes('\\.')) {
          throw new Error('Should escape regex special characters');
        }
      }
    },
    
    {
      name: 'Should handle empty search queries',
      async test() {
        const mockOrganizer = {
          bookmarkTree: {
            id: '0',
            type: 'folder',
            children: [
              {
                id: '10',
                type: 'bookmark',
                title: 'Test Bookmark',
                url: 'https://test.com',
                parentId: '0'
              }
            ]
          }
        };
        
        const bookmarkSearch = new BookmarkSearch(mockOrganizer);
        await bookmarkSearch.initialize();
        
        const results = bookmarkSearch.searchBookmarks('');
        
        if (results.length !== 0) {
          throw new Error('Empty query should return no results');
        }
      }
    },
    
    {
      name: 'Should limit search results correctly',
      async test() {
        const mockOrganizer = {
          bookmarkTree: {
            id: '0',
            type: 'folder',
            children: []
          }
        };
        
        // Add many bookmarks with similar titles
        for (let i = 0; i < 60; i++) {
          mockOrganizer.bookmarkTree.children.push({
            id: `${10 + i}`,
            type: 'bookmark',
            title: `Test Bookmark ${i}`,
            url: `https://test${i}.com`,
            parentId: '0'
          });
        }
        
        const bookmarkSearch = new BookmarkSearch(mockOrganizer);
        await bookmarkSearch.initialize();
        
        const results = bookmarkSearch.searchBookmarks('test');
        
        if (results.length > 50) {
          throw new Error(`Search results should be limited to 50, got ${results.length}`);
        }
      }
    },
    
    {
      name: 'Should sort results by relevance score',
      async test() {
        const mockOrganizer = {
          bookmarkTree: {
            id: '0',
            type: 'folder',
            children: [
              {
                id: '10',
                type: 'bookmark',
                title: 'JavaScript',  // Should score highest for 'javascript'
                url: 'https://javascript.com',
                parentId: '0'
              },
              {
                id: '11',
                type: 'bookmark',
                title: 'Learning JavaScript Programming',  // Should score lower
                url: 'https://learn.com/js',
                parentId: '0'
              },
              {
                id: '12',
                type: 'bookmark',
                title: 'Python Programming',  // Should not match
                url: 'https://python.com',
                parentId: '0'
              }
            ]
          }
        };
        
        const bookmarkSearch = new BookmarkSearch(mockOrganizer);
        await bookmarkSearch.initialize();
        
        const results = bookmarkSearch.searchBookmarks('javascript');
        
        if (results.length < 2) {
          throw new Error('Should find at least 2 matching results');
        }
        
        // Results should be sorted by score (highest first)
        for (let i = 1; i < results.length; i++) {
          if (results[i-1].score < results[i].score) {
            throw new Error('Results should be sorted by score in descending order');
          }
        }
        
        // First result should be the exact match
        if (results[0].title !== 'JavaScript') {
          throw new Error(`Expected 'JavaScript' as first result, got '${results[0].title}'`);
        }
      }
    },
    
    {
      name: 'Should handle recency bonus correctly',
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
                title: 'JavaScript Guide',
                url: 'https://js1.com',
                dateAdded: now - (25 * 24 * 60 * 60 * 1000), // 25 days ago (recent)
                parentId: '0'
              },
              {
                id: '11',
                type: 'bookmark',
                title: 'JavaScript Guide',
                url: 'https://js2.com',
                dateAdded: now - (100 * 24 * 60 * 60 * 1000), // 100 days ago (old)
                parentId: '0'
              }
            ]
          }
        };
        
        const bookmarkSearch = new BookmarkSearch(mockOrganizer);
        await bookmarkSearch.initialize();
        
        const results = bookmarkSearch.searchBookmarks('javascript');
        
        if (results.length !== 2) {
          throw new Error(`Expected 2 results, got ${results.length}`);
        }
        
        // Recent bookmark should score higher due to recency bonus
        const recentBookmark = results.find(r => r.url === 'https://js1.com');
        const oldBookmark = results.find(r => r.url === 'https://js2.com');
        
        if (recentBookmark.score <= oldBookmark.score) {
          throw new Error('Recent bookmark should have higher score due to recency bonus');
        }
      }
    },
    
    {
      name: 'Should handle domain matching bonus',
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
                parentId: '0'
              },
              {
                id: '11',
                type: 'bookmark',
                title: 'Some Other Site',
                url: 'https://other.com/github-tutorial',
                parentId: '0'
              }
            ]
          }
        };
        
        const bookmarkSearch = new BookmarkSearch(mockOrganizer);
        await bookmarkSearch.initialize();
        
        const results = bookmarkSearch.searchBookmarks('github');
        
        if (results.length !== 2) {
          throw new Error(`Expected 2 results, got ${results.length}`);
        }
        
        // Domain match should score higher
        const domainMatch = results.find(r => r.url.includes('github.com'));
        const pathMatch = results.find(r => r.url.includes('other.com'));
        
        if (domainMatch.score <= pathMatch.score) {
          throw new Error('Domain match should score higher than path match');
        }
      }
    }
  ]
}; 