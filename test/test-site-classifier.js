// Tests for SiteClassifier
const SiteClassifierTests = {
  name: 'SiteClassifier Tests',
  
  tests: [
    {
      name: 'Should classify known development sites correctly',
      async test() {
        const classifier = new SiteClassifier();
        
        const testCases = [
          { url: 'https://github.com/user/repo', expected: 'Development/Code Repositories' },
          { url: 'https://stackoverflow.com/questions/123', expected: 'Development/Q&A' },
          { url: 'https://docs.python.org/3/', expected: 'Development/Documentation' },
          { url: 'https://api.example.com/v1/docs', expected: 'Development/Documentation' }
        ];
        
        for (const testCase of testCases) {
          const result = classifier.classifySite(testCase.url);
          if (!result.includes(testCase.expected)) {
            throw new Error(`Expected ${testCase.url} to be classified as ${testCase.expected}, got ${result}`);
          }
        }
      }
    },
    
    {
      name: 'Should classify news sites correctly',
      async test() {
        const classifier = new SiteClassifier();
        
        const testCases = [
          { url: 'https://techcrunch.com/article', expected: 'News' },
          { url: 'https://www.bbc.com/news/world', expected: 'News' },
          { url: 'https://example-news.com/2024/01/01/story', expected: 'News' }
        ];
        
        for (const testCase of testCases) {
          const result = classifier.classifySite(testCase.url);
          if (!result.includes(testCase.expected)) {
            throw new Error(`Expected ${testCase.url} to contain ${testCase.expected}, got ${result}`);
          }
        }
      }
    },
    
    {
      name: 'Should classify shopping sites correctly',
      async test() {
        const classifier = new SiteClassifier();
        
        const testCases = [
          { url: 'https://shop.example.com/products', expected: 'Shopping' },
          { url: 'https://store.example.com/cart', expected: 'Shopping' },
          { url: 'https://example.com/checkout', expected: 'Shopping' }
        ];
        
        for (const testCase of testCases) {
          const result = classifier.classifySite(testCase.url);
          if (!result.includes(testCase.expected)) {
            throw new Error(`Expected ${testCase.url} to contain ${testCase.expected}, got ${result}`);
          }
        }
      }
    },
    
    {
      name: 'Should handle special TLDs correctly',
      async test() {
        const classifier = new SiteClassifier();
        
        const testCases = [
          { url: 'https://example.gov', expected: 'Reference/Government' },
          { url: 'https://example.edu', expected: 'Education/Academic' },
          { url: 'https://example.org', expected: 'Reference/Organizations' }
        ];
        
        for (const testCase of testCases) {
          const result = classifier.classifySite(testCase.url);
          if (result !== testCase.expected) {
            throw new Error(`Expected ${testCase.url} to be ${testCase.expected}, got ${result}`);
          }
        }
      }
    },
    
    {
      name: 'Should learn from user actions',
      async test() {
        const classifier = new SiteClassifier();
        
        // Clear any existing data
        await browser.storage.local.clear();
        
        // Teach it a custom classification
        await classifier.learnFromUserAction('https://mycompany.com', 'Work/Internal Tools');
        
        // Check if it learned
        const result = classifier.classifySite('https://mycompany.com');
        if (result !== 'Work/Internal Tools') {
          throw new Error(`Expected learned classification, got ${result}`);
        }
      }
    },
    
    {
      name: 'Should calculate category scores correctly',
      async test() {
        const classifier = new SiteClassifier();
        
        const scores = classifier.calculateCategoryScores(
          'github.com',
          '/docs/api',
          'API Documentation - GitHub'
        );
        
        if (!scores.Development || scores.Development < 5) {
          throw new Error(`Expected high Development score, got ${scores.Development}`);
        }
      }
    },
    
    {
      name: 'Should provide fallback categories for unknown sites',
      async test() {
        const classifier = new SiteClassifier();
        
        const result = classifier.classifySite('https://random-unknown-site-12345.com');
        
        if (!result.includes('Other/')) {
          throw new Error(`Expected fallback category, got ${result}`);
        }
      }
    },
    
    {
      name: 'Should handle blog patterns',
      async test() {
        const classifier = new SiteClassifier();
        
        const testCases = [
          'https://example.com/blog/post',
          'https://blog.example.com',
          'https://example.wordpress.com'
        ];
        
        for (const url of testCases) {
          const result = classifier.classifySite(url);
          if (!result.includes('Reading/Blogs')) {
            throw new Error(`Expected ${url} to be classified as blog, got ${result}`);
          }
        }
      }
    },
    
    {
      name: 'Should export and import user data',
      async test() {
        const classifier = new SiteClassifier();
        
        // Add some custom data
        await classifier.learnFromUserAction('https://test1.com', 'Custom/Category1');
        await classifier.learnFromUserAction('https://test2.com', 'Custom/Category2');
        
        // Export
        const exportedData = await classifier.exportUserData();
        
        // Clear and create new instance
        await browser.storage.local.clear();
        const newClassifier = new SiteClassifier();
        
        // Import
        await newClassifier.importUserData(exportedData);
        
        // Verify
        const result1 = newClassifier.classifySite('https://test1.com');
        const result2 = newClassifier.classifySite('https://test2.com');
        
        if (result1 !== 'Custom/Category1' || result2 !== 'Custom/Category2') {
          throw new Error('Import/export failed');
        }
      }
    },
    
    {
      name: 'Should suggest categories for manual override',
      async test() {
        const classifier = new SiteClassifier();
        
        const suggestions = classifier.getSuggestedCategoriesForUrl(
          'https://github.com/user/repo',
          'My Project Repository'
        );
        
        if (!suggestions || suggestions.length === 0) {
          throw new Error('No suggestions provided');
        }
        
        const devSuggestion = suggestions.find(s => s.category === 'Development');
        if (!devSuggestion || devSuggestion.confidence < 0.5) {
          throw new Error('Expected Development to be suggested with high confidence');
        }
      }
    }
  ]
}; 