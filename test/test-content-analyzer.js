// Tests for ContentAnalyzer
const ContentAnalyzerTests = {
  name: 'ContentAnalyzer Tests',
  
  tests: [
    {
      name: 'Should analyze URL patterns correctly',
      async test() {
        const analyzer = new ContentAnalyzer();
        
        const testCases = [
          { 
            url: 'https://example.com/shop/products/item123',
            expectedCategory: 'Shopping/E-commerce',
            minConfidence: 0.8
          },
          {
            url: 'https://example.com/docs/api/reference',
            expectedCategory: 'Development/Documentation',
            minConfidence: 0.8
          },
          {
            url: 'https://example.com/watch?v=abc123',
            expectedCategory: 'Entertainment/Video',
            minConfidence: 0.8
          }
        ];
        
        for (const testCase of testCases) {
          const result = analyzer.analyzeURL(testCase.url);
          
          if (!result || result.confidence === 0) {
            throw new Error(`Failed to analyze URL: ${testCase.url}`);
          }
          
          if (result.category !== testCase.expectedCategory) {
            throw new Error(`Expected ${testCase.expectedCategory}, got ${result.category}`);
          }
          
          if (result.confidence < testCase.minConfidence) {
            throw new Error(`Confidence too low: ${result.confidence}`);
          }
        }
      }
    },
    
    {
      name: 'Should analyze titles correctly',
      async test() {
        const analyzer = new ContentAnalyzer();
        
        const testCases = [
          {
            title: 'Learn JavaScript - Complete Tutorial for Beginners',
            expectedCategory: 'Education/Tutorials',
            minConfidence: 0.7
          },
          {
            title: 'Breaking News: Major Update Released',
            expectedCategory: 'News/Current',
            minConfidence: 0.7
          },
          {
            title: 'Buy Now - 50% Off Sale Today Only',
            expectedCategory: 'Shopping/Products',
            minConfidence: 0.7
          }
        ];
        
        for (const testCase of testCases) {
          const result = analyzer.analyzeTitle(testCase.title);
          
          if (!result || result.confidence === 0) {
            throw new Error(`Failed to analyze title: ${testCase.title}`);
          }
          
          if (result.category !== testCase.expectedCategory) {
            throw new Error(`Expected ${testCase.expectedCategory}, got ${result.category}`);
          }
        }
      }
    },
    
    {
      name: 'Should detect content types',
      async test() {
        const analyzer = new ContentAnalyzer();
        
        const testCases = [
          { url: 'https://example.com/document.pdf', expected: 'Documents/Files' },
          { url: 'https://example.com/image.jpg', expected: 'Media/Images' },
          { url: 'https://example.com/video.mp4', expected: 'Media/Videos' },
          { url: 'https://example.com/app.zip', expected: 'Downloads/Software' }
        ];
        
        for (const testCase of testCases) {
          const result = analyzer.analyzeContentType(testCase.url, '');
          
          if (result.category !== testCase.expected) {
            throw new Error(`Expected ${testCase.expected}, got ${result.category}`);
          }
        }
      }
    },
    
    {
      name: 'Should extract tags from content',
      async test() {
        const analyzer = new ContentAnalyzer();
        
        const tags = analyzer.extractTags(
          'https://github.com/react/react',
          'React - A JavaScript library for building user interfaces'
        );
        
        if (!Array.isArray(tags)) {
          throw new Error('Tags should be an array');
        }
        
        const expectedTags = ['react', 'javascript'];
        for (const expected of expectedTags) {
          if (!tags.includes(expected)) {
            throw new Error(`Expected tag "${expected}" not found`);
          }
        }
      }
    },
    
    {
      name: 'Should batch process bookmarks',
      async test() {
        const analyzer = new ContentAnalyzer();
        
        const bookmarks = [
          { url: 'https://unknown1.com', title: 'Test 1' },
          { url: 'https://unknown2.com', title: 'Test 2' },
          { url: 'https://unknown3.com', title: 'Test 3' }
        ];
        
        let progressCalled = false;
        const results = await analyzer.analyzeBookmarks(bookmarks, (progress) => {
          progressCalled = true;
        });
        
        if (!progressCalled) {
          throw new Error('Progress callback not called');
        }
        
        if (results.length !== bookmarks.length) {
          throw new Error(`Expected ${bookmarks.length} results, got ${results.length}`);
        }
      }
    },
    
    {
      name: 'Should skip well-known domains',
      async test() {
        const analyzer = new ContentAnalyzer();
        
        const wellKnownDomains = [
          'https://github.com',
          'https://google.com',
          'https://facebook.com'
        ];
        
        for (const url of wellKnownDomains) {
          const needsAnalysis = analyzer.needsAnalysis(url, 'Title');
          if (needsAnalysis) {
            throw new Error(`Should skip well-known domain: ${url}`);
          }
        }
      }
    },
    
    {
      name: 'Should handle invalid URLs gracefully',
      async test() {
        const analyzer = new ContentAnalyzer();
        
        const result = await analyzer.analyzeBookmark({
          url: 'not-a-valid-url',
          title: 'Invalid'
        });
        
        // Should return null or a default category
        if (result && result.category && !result.category.includes('Other/')) {
          throw new Error('Should return Other category for invalid URL');
        }
      }
    },
    
    {
      name: 'Should manage cache correctly',
      async test() {
        const analyzer = new ContentAnalyzer();
        
        // Analyze a bookmark
        const bookmark = { url: 'https://test-cache.com', title: 'Cache Test' };
        const result1 = await analyzer.analyzeBookmark(bookmark);
        
        // Analyze same bookmark again - should use cache
        const result2 = await analyzer.analyzeBookmark(bookmark);
        
        if (result1 !== result2) {
          throw new Error('Cache not working correctly');
        }
        
        // Check cache stats
        const stats = analyzer.getCacheStats();
        if (stats.size !== 1) {
          throw new Error('Cache size incorrect');
        }
        
        // Clear cache
        analyzer.clearCache();
        const statsAfterClear = analyzer.getCacheStats();
        if (statsAfterClear.size !== 0) {
          throw new Error('Cache not cleared');
        }
      }
    },
    
    {
      name: 'Should perform weighted analysis',
      async test() {
        const analyzer = new ContentAnalyzer();
        
        const result = await analyzer.performAnalysis(
          'https://shop.example.com/products',
          'Buy Our Products - Great Deals'
        );
        
        if (!result.category || !result.confidence) {
          throw new Error('Analysis should return category and confidence');
        }
        
        if (result.confidence < 0 || result.confidence > 1) {
          throw new Error('Confidence should be between 0 and 1');
        }
      }
    }
  ]
}; 