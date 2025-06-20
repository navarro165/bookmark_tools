// Tests for BookmarkSearch
const BookmarkSearchTests = {
  name: 'BookmarkSearch Tests',
  
  tests: [
    {
      name: 'Should build search index correctly',
      async test() {
        // Create mock organizer
        const mockOrganizer = {
          bookmarkTree: window.mockBookmarks[0]
        };
        
        const search = new BookmarkSearch(mockOrganizer);
        await search.initialize();
        
        if (search.allBookmarks.length === 0) {
          throw new Error('No bookmarks indexed');
        }
        
        if (search.searchIndex.size === 0) {
          throw new Error('Search index is empty');
        }
      }
    },
    
    {
      name: 'Should extract bookmarks with paths',
      async test() {
        const mockOrganizer = {
          bookmarkTree: window.mockBookmarks[0]
        };
        
        const search = new BookmarkSearch(mockOrganizer);
        search.extractBookmarksWithPaths(mockOrganizer.bookmarkTree, '');
        
        const githubBookmark = search.allBookmarks.find(b => b.url.includes('github.com'));
        if (!githubBookmark) {
          throw new Error('GitHub bookmark not found');
        }
        
        if (!githubBookmark.path.includes('Development')) {
          throw new Error('Path not extracted correctly');
        }
      }
    },
    
    {
      name: 'Should tokenize text correctly',
      async test() {
        const mockOrganizer = { bookmarkTree: { children: [] } };
        const search = new BookmarkSearch(mockOrganizer);
        
        const tokens = search.tokenize('Hello World! Test-123');
        
        if (!Array.isArray(tokens)) {
          throw new Error('Tokens should be an array');
        }
        
        if (!tokens.includes('hello') || !tokens.includes('world') || !tokens.includes('test')) {
          throw new Error('Tokenization failed');
        }
      }
    },
    
    {
      name: 'Should extract domain correctly',
      async test() {
        const mockOrganizer = { bookmarkTree: { children: [] } };
        const search = new BookmarkSearch(mockOrganizer);
        
        const testCases = [
          { url: 'https://www.github.com/user', expected: 'github.com' },
          { url: 'https://stackoverflow.com', expected: 'stackoverflow.com' },
          { url: 'invalid-url', expected: '' }
        ];
        
        for (const testCase of testCases) {
          const domain = search.extractDomain(testCase.url);
          if (domain !== testCase.expected) {
            throw new Error(`Expected ${testCase.expected}, got ${domain}`);
          }
        }
      }
    },
    
    {
      name: 'Should calculate relevance scores',
      async test() {
        const mockOrganizer = { bookmarkTree: { children: [] } };
        const search = new BookmarkSearch(mockOrganizer);
        
        const indexData = {
          bookmark: {
            title: 'GitHub - Where software is built',
            url: 'https://github.com',
            path: 'Development'
          },
          searchText: 'github where software is built development',
          tokens: ['github', 'where', 'software', 'is', 'built', 'development']
        };
        
        // Exact match should have high score
        const score1 = search.calculateRelevanceScore(indexData, 'github', ['github']);
        if (score1 < 100) {
          throw new Error('Exact match should have high score');
        }
        
        // Partial match should have lower score
        const score2 = search.calculateRelevanceScore(indexData, 'git', ['git']);
        if (score2 >= score1) {
          throw new Error('Partial match should have lower score than exact match');
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
          throw new Error('No results found for "github"');
        }
        
        // Should find both GitHub bookmarks
        const githubResults = results.filter(r => r.url.includes('github.com'));
        if (githubResults.length < 2) {
          throw new Error('Should find duplicate GitHub bookmarks');
        }
        
        // Results should be sorted by score
        for (let i = 1; i < results.length; i++) {
          if (results[i].score > results[i-1].score) {
            throw new Error('Results not sorted by score');
          }
        }
      }
    },
    
    {
      name: 'Should highlight search terms',
      async test() {
        const mockOrganizer = { bookmarkTree: { children: [] } };
        const search = new BookmarkSearch(mockOrganizer);
        
        const highlighted = search.highlightText('Hello GitHub World', 'github');
        
        if (!highlighted.includes('<span class="search-highlight">')) {
          throw new Error('Highlighting not applied');
        }
        
        if (!highlighted.includes('GitHub')) {
          throw new Error('Case-insensitive highlighting failed');
        }
      }
    },
    
    {
      name: 'Should extract keywords correctly',
      async test() {
        const mockOrganizer = { bookmarkTree: { children: [] } };
        const search = new BookmarkSearch(mockOrganizer);
        
        const keywords = search.extractKeywords('The quick brown fox jumps over the lazy dog');
        
        if (keywords.includes('the') || keywords.includes('over')) {
          throw new Error('Common words should be filtered out');
        }
        
        if (!keywords.includes('quick') || !keywords.includes('brown')) {
          throw new Error('Meaningful words should be kept');
        }
      }
    },
    
    {
      name: 'Should handle empty search correctly',
      async test() {
        const mockOrganizer = {
          bookmarkTree: window.mockBookmarks[0]
        };
        
        const search = new BookmarkSearch(mockOrganizer);
        await search.initialize();
        
        // Mock the display methods
        let hideResultsCalled = false;
        search.hideResults = () => { hideResultsCalled = true; };
        
        search.handleSearch('');
        
        // Wait for debounce
        await new Promise(resolve => setTimeout(resolve, 200));
        
        if (!hideResultsCalled) {
          throw new Error('Should hide results for empty search');
        }
      }
    },
    
    {
      name: 'Should escape HTML in results',
      async test() {
        const mockOrganizer = { bookmarkTree: { children: [] } };
        const search = new BookmarkSearch(mockOrganizer);
        
        const escaped = search.escapeHtml('<script>alert("xss")</script>');
        
        if (escaped.includes('<script>')) {
          throw new Error('HTML not escaped properly');
        }
        
        if (!escaped.includes('&lt;script&gt;')) {
          throw new Error('HTML entities not created');
        }
      }
    }
  ]
}; 