// Modern tests for ContentAnalyzer
const ContentAnalyzerNewTests = {
  name: 'ContentAnalyzer (New Implementation) Tests',
  
  tests: [
    {
      name: 'Should initialize correctly with default settings',
      async test() {
        const analyzer = new ContentAnalyzer();
        
        if (analyzer.batchSize !== 10) {
          throw new Error(`Expected batch size 10, got ${analyzer.batchSize}`);
        }
        
        if (analyzer.rateLimitDelay !== 100) {
          throw new Error(`Expected rate limit delay 100ms, got ${analyzer.rateLimitDelay}`);
        }
        
        if (analyzer.enablePageFetch !== false) {
          throw new Error('Page fetch should be disabled by default');
        }
        
        if (!(analyzer.analysisCache instanceof Map)) {
          throw new Error('Analysis cache should be a Map');
        }
      }
    },
    
    {
      name: 'Should set site classifier correctly',
      async test() {
        const analyzer = new ContentAnalyzer();
        const mockClassifier = { classifySite: () => ({ category: 'Test', confidence: 0.8 }) };
        
        analyzer.setSiteClassifier(mockClassifier);
        
        if (analyzer.siteClassifier !== mockClassifier) {
          throw new Error('Site classifier not set correctly');
        }
      }
    },
    
    {
      name: 'Should analyze URL patterns correctly',
      async test() {
        const analyzer = new ContentAnalyzer();
        
        const testCases = [
          {
            url: 'https://example.com/docs/api/reference',
            expected: 'Development',
            confidence: 0.85
          },
          {
            url: 'https://shop.example.com/products/laptop',
            expected: 'Shopping',
            confidence: 0.9
          },
          {
            url: 'https://example.com/news/article/2024',
            expected: 'News',
            confidence: 0.8
          },
          {
            url: 'https://example.com/watch/video123',
            expected: 'Entertainment',
            confidence: 0.85
          }
        ];
        
        for (const testCase of testCases) {
          const result = analyzer.analyzeURL(testCase.url);
          
          if (result.category !== testCase.expected) {
            throw new Error(`Expected category '${testCase.expected}' for URL '${testCase.url}', got '${result.category}'`);
          }
          
          if (result.confidence < 0.5) {
            throw new Error(`Expected decent confidence for URL '${testCase.url}', got ${result.confidence}`);
          }
        }
      }
    },
    
    {
      name: 'Should analyze title patterns correctly',
      async test() {
        const analyzer = new ContentAnalyzer();
        
        const testCases = [
          {
            title: 'JavaScript API Documentation and Reference Guide',
            expected: 'Development',
            minConfidence: 0.8
          },
          {
            title: 'How to Learn Python Programming - Complete Tutorial',
            expected: 'Education',
            minConfidence: 0.7
          },
          {
            title: 'Breaking News: Latest Technology Updates Today',
            expected: 'News',
            minConfidence: 0.8
          },
          {
            title: 'Buy Best Laptop Deals - Special Sale Offer',
            expected: 'Shopping',
            minConfidence: 0.7
          }
        ];
        
        for (const testCase of testCases) {
          const result = analyzer.analyzeTitle(testCase.title);
          
          if (result.category !== testCase.expected) {
            throw new Error(`Expected category '${testCase.expected}' for title '${testCase.title}', got '${result.category}'`);
          }
          
          if (result.confidence < testCase.minConfidence) {
            throw new Error(`Expected confidence >= ${testCase.minConfidence} for title '${testCase.title}', got ${result.confidence}`);
          }
        }
      }
    },
    
    {
      name: 'Should analyze domain patterns correctly',
      async test() {
        const analyzer = new ContentAnalyzer();
        
        const testCases = [
          {
            url: 'https://github.com/user/repo',
            expected: 'Development',
            minConfidence: 0.9
          },
          {
            url: 'https://university.edu/courses',
            expected: 'Education',
            minConfidence: 0.8
          },
          {
            url: 'https://government.gov/services',
            expected: 'Reference',
            minConfidence: 0.9
          },
          {
            url: 'https://stackoverflow.com/questions',
            expected: 'Development',
            minConfidence: 0.7
          }
        ];
        
        for (const testCase of testCases) {
          const result = analyzer.analyzeDomain(testCase.url);
          
          if (result.category !== testCase.expected) {
            throw new Error(`Expected category '${testCase.expected}' for domain '${testCase.url}', got '${result.category}'`);
          }
          
          if (result.confidence < testCase.minConfidence) {
            throw new Error(`Expected confidence >= ${testCase.minConfidence} for domain '${testCase.url}', got ${result.confidence}`);
          }
        }
      }
    },
    
    {
      name: 'Should analyze content types correctly',
      async test() {
        const analyzer = new ContentAnalyzer();
        
        const testCases = [
          {
            url: 'https://example.com/document.pdf',
            title: 'Research Paper PDF',
            expected: 'Documents',
            minConfidence: 0.8
          },
          {
            url: 'https://example.com/video.mp4',
            title: 'Training Video Content',
            expected: 'Media',
            minConfidence: 0.8
          },
          {
            url: 'https://example.com/photo.jpg',
            title: 'Image Gallery Photo',
            expected: 'Media',
            minConfidence: 0.8
          },
          {
            url: 'https://example.com/software.zip',
            title: 'Download Software Package',
            expected: 'Downloads',
            minConfidence: 0.7
          }
        ];
        
        for (const testCase of testCases) {
          const result = analyzer.analyzeContentType(testCase.url, testCase.title);
          
          if (result.category !== testCase.expected) {
            throw new Error(`Expected category '${testCase.expected}' for content '${testCase.url}', got '${result.category}'`);
          }
          
          if (result.confidence < testCase.minConfidence) {
            throw new Error(`Expected confidence >= ${testCase.minConfidence} for content '${testCase.url}', got ${result.confidence}`);
          }
        }
      }
    },
    
    {
      name: 'Should extract relevant tags',
      async test() {
        const analyzer = new ContentAnalyzer();
        
        const tags = analyzer.extractTags(
          'https://github.com/user/javascript-tutorial-2024',
          'JavaScript Tutorial: Complete Guide to React Development'
        );
        
        if (!Array.isArray(tags)) {
          throw new Error('extractTags should return an array');
        }
        
        // Should include technology tags
        if (!tags.includes('javascript')) {
          throw new Error('Should extract javascript tag');
        }
        
        if (!tags.includes('react')) {
          throw new Error('Should extract react tag');
        }
        
        // Should include topic tags
        if (!tags.includes('tutorial')) {
          throw new Error('Should extract tutorial tag');
        }
        
        // Should include year if present
        if (!tags.includes('2024')) {
          throw new Error('Should extract year 2024');
        }
      }
    },
    
    {
      name: 'Should determine if bookmark needs analysis',
      async test() {
        const analyzer = new ContentAnalyzer();
        
        // Well-known sites should not need analysis by default
        const needsAnalysis1 = analyzer.needsAnalysis('https://github.com/user/repo', 'GitHub Repository');
        if (needsAnalysis1 === true) {
          throw new Error('GitHub should not need analysis by default');
        }
        
        // Unknown sites should need analysis
        const needsAnalysis2 = analyzer.needsAnalysis('https://unknown-site-xyz.com/page', 'Some Page');
        if (needsAnalysis2 !== true) {
          throw new Error('Unknown site should need analysis');
        }
        
        // When page fetch is enabled, more sites should need analysis
        analyzer.enablePageFetch = true;
        const needsAnalysis3 = analyzer.needsAnalysis('https://github.com/user/repo', 'GitHub Repository');
        if (needsAnalysis3 !== true) {
          throw new Error('With page fetch enabled, GitHub should need analysis');
        }
      }
    },
    
    {
      name: 'Should create batches correctly',
      async test() {
        const analyzer = new ContentAnalyzer();
        
        const items = Array.from({ length: 25 }, (_, i) => ({ id: i }));
        const batches = analyzer.createBatches(items, 10);
        
        if (batches.length !== 3) {
          throw new Error(`Expected 3 batches, got ${batches.length}`);
        }
        
        if (batches[0].length !== 10 || batches[1].length !== 10 || batches[2].length !== 5) {
          throw new Error('Batch sizes incorrect');
        }
      }
    },
    
    {
      name: 'Should perform complete analysis correctly',
      async test() {
        const analyzer = new ContentAnalyzer();
        
        // Mock site classifier
        const mockClassifier = {
          classifyWithPageFetch: async (url, title) => ({
            category: 'Development',
            confidence: 0.8
          })
        };
        analyzer.setSiteClassifier(mockClassifier);
        
        const result = await analyzer.performAnalysis(
          'https://docs.example.com/api/guide',
          'API Documentation Guide',
          null
        );
        
        if (!result.category) {
          throw new Error('Analysis should return a category');
        }
        
        if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) {
          throw new Error('Analysis should return valid confidence value');
        }
        
        if (!result.description) {
          throw new Error('Analysis should return a description');
        }
        
        if (!Array.isArray(result.tags)) {
          throw new Error('Analysis should return tags array');
        }
      }
    },
    
    {
      name: 'Should handle analysis with weighted scoring',
      async test() {
        const analyzer = new ContentAnalyzer();
        
        const result = await analyzer.performAnalysis(
          'https://docs.python.org/3/tutorial/',
          'Python Programming Tutorial Documentation',
          null
        );
        
        // Should classify as Development due to multiple strong signals
        if (result.category !== 'Development') {
          throw new Error(`Expected Development category, got ${result.category}`);
        }
        
        // Should have high confidence due to multiple matching analyses
        if (result.confidence < 0.7) {
          throw new Error(`Expected high confidence, got ${result.confidence}`);
        }
      }
    },
    
    {
      name: 'Should provide default analysis for unknown content',
      async test() {
        const analyzer = new ContentAnalyzer();
        
        const result = analyzer.getDefaultAnalysis('https://completely-unknown-xyz789.com');
        
        if (result.category !== 'Other') {
          throw new Error(`Expected 'Other' category, got ${result.category}`);
        }
        
        if (result.confidence > 0.6) {
          throw new Error(`Expected low confidence for unknown content, got ${result.confidence}`);
        }
        
        if (!result.description) {
          throw new Error('Should provide a description');
        }
      }
    },
    
    {
      name: 'Should handle invalid URLs gracefully',
      async test() {
        const analyzer = new ContentAnalyzer();
        
        const result = analyzer.getDefaultAnalysis('not-a-valid-url');
        
        if (result.category !== 'Other') {
          throw new Error(`Expected 'Other' for invalid URL, got ${result.category}`);
        }
        
        if (result.confidence > 0.2) {
          throw new Error(`Expected very low confidence for invalid URL, got ${result.confidence}`);
        }
      }
    },
    
    {
      name: 'Should cache analysis results',
      async test() {
        const analyzer = new ContentAnalyzer();
        const testUrl = 'https://test.example.com';
        
        // First analysis
        const bookmark1 = { url: testUrl, title: 'Test Page' };
        const result1 = await analyzer.analyzeBookmark(bookmark1, null);
        
        if (!result1) {
          throw new Error('Analysis should return a result');
        }
        
        // Second analysis of same URL should use cache
        const bookmark2 = { url: testUrl, title: 'Different Title' };
        const result2 = await analyzer.analyzeBookmark(bookmark2, null);
        
        if (result1 !== result2) {
          throw new Error('Second analysis should return cached result');
        }
        
        if (!analyzer.analysisCache.has(testUrl)) {
          throw new Error('Result should be cached');
        }
      }
    },
    
    {
      name: 'Should analyze bookmarks in batches',
      async test() {
        const analyzer = new ContentAnalyzer();
        analyzer.batchSize = 3; // Small batch size for testing
        
        const bookmarks = Array.from({ length: 8 }, (_, i) => ({
          url: `https://test${i}.com`,
          title: `Test Bookmark ${i}`
        }));
        
        let progressCalls = 0;
        const onProgress = (message) => {
          progressCalls++;
        };
        
        const results = await analyzer.analyzeBookmarks(bookmarks, onProgress);
        
        if (results.length !== 8) {
          throw new Error(`Expected 8 results, got ${results.length}`);
        }
        
        if (progressCalls < 2) {
          throw new Error('Should call progress callback multiple times for batches');
        }
      }
    },
    
    {
      name: 'Should handle analysis errors gracefully',
      async test() {
        const analyzer = new ContentAnalyzer();
        
        // Mock a classifier that throws an error
        const mockClassifier = {
          classifyWithPageFetch: async () => {
            throw new Error('Classification failed');
          }
        };
        analyzer.setSiteClassifier(mockClassifier);
        analyzer.enablePageFetch = true;
        
        const bookmark = { url: 'https://test.com', title: 'Test' };
        const result = await analyzer.analyzeBookmark(bookmark, null);
        
        // Should return null for failed analysis
        if (result !== null) {
          throw new Error('Failed analysis should return null');
        }
      }
    },
    
    {
      name: 'Should respect page fetch setting',
      async test() {
        const analyzer = new ContentAnalyzer();
        
        const bookmarks = [
          { url: 'https://github.com/user/repo', title: 'GitHub Repository' },
          { url: 'https://unknown-site.com', title: 'Unknown Site' }
        ];
        
        // With page fetch disabled (default)
        analyzer.enablePageFetch = false;
        const results1 = await analyzer.analyzeBookmarks(bookmarks, () => {});
        
        // Should only analyze unknown bookmarks
        const unknownAnalyzed1 = results1.filter(r => r !== null).length;
        
        // With page fetch enabled
        analyzer.enablePageFetch = true;
        analyzer.analysisCache.clear(); // Clear cache
        const results2 = await analyzer.analyzeBookmarks(bookmarks, () => {});
        
        // Should analyze more bookmarks
        const unknownAnalyzed2 = results2.filter(r => r !== null).length;
        
        if (unknownAnalyzed2 <= unknownAnalyzed1) {
          throw new Error('Page fetch enabled should analyze more bookmarks');
        }
      }
    },
    
    {
      name: 'Should provide cache statistics',
      async test() {
        const analyzer = new ContentAnalyzer();
        
        // Add some cached results
        await analyzer.analyzeBookmark({ url: 'https://test1.com', title: 'Test 1' }, null);
        await analyzer.analyzeBookmark({ url: 'https://test2.com', title: 'Test 2' }, null);
        
        const stats = analyzer.getCacheStats();
        
        if (typeof stats.size !== 'number' || stats.size < 2) {
          throw new Error('Cache stats should show correct size');
        }
        
        if (typeof stats.memoryEstimate !== 'number' || stats.memoryEstimate <= 0) {
          throw new Error('Cache stats should estimate memory usage');
        }
      }
    },
    
    {
      name: 'Should clear cache correctly',
      async test() {
        const analyzer = new ContentAnalyzer();
        
        // Add cached results
        await analyzer.analyzeBookmark({ url: 'https://test.com', title: 'Test' }, null);
        
        if (analyzer.analysisCache.size === 0) {
          throw new Error('Cache should contain results');
        }
        
        analyzer.clearCache();
        
        if (analyzer.analysisCache.size !== 0) {
          throw new Error('Cache should be empty after clearing');
        }
      }
    },
    
    {
      name: 'Should handle delay correctly',
      async test() {
        const analyzer = new ContentAnalyzer();
        
        const startTime = Date.now();
        await analyzer.delay(50);
        const endTime = Date.now();
        
        const elapsed = endTime - startTime;
        if (elapsed < 45 || elapsed > 100) {
          throw new Error(`Expected delay around 50ms, got ${elapsed}ms`);
        }
      }
    }
  ]
}; 