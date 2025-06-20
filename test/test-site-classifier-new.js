// Modern tests for SiteClassifier (keyword-based classification)
const SiteClassifierNewTests = {
  name: 'SiteClassifier (New Implementation) Tests',
  
  tests: [
    {
      name: 'Should classify development sites using keywords',
      async test() {
        const classifier = new SiteClassifier();
        
        const testCases = [
          { 
            url: 'https://github.com/user/repo', 
            title: 'My JavaScript Project - GitHub',
            expected: 'Development' 
          },
          { 
            url: 'https://docs.python.org/3/tutorial/', 
            title: 'Python Tutorial Documentation',
            expected: 'Development' 
          },
          { 
            url: 'https://stackoverflow.com/questions/123', 
            title: 'How to debug JavaScript code',
            expected: 'Development' 
          },
          {
            url: 'https://api.example.com/reference',
            title: 'REST API Reference Guide',
            expected: 'Development'
          }
        ];
        
        for (const testCase of testCases) {
          const result = classifier.classifySite(testCase.url, testCase.title);
          if (result.category !== testCase.expected) {
            throw new Error(`Expected ${testCase.url} to be classified as ${testCase.expected}, got ${result.category} (confidence: ${result.confidence})`);
          }
          if (result.confidence < 0.5) {
            throw new Error(`Expected high confidence for ${testCase.url}, got ${result.confidence}`);
          }
        }
      }
    },
    
    {
      name: 'Should classify news sites using keywords',
      async test() {
        const classifier = new SiteClassifier();
        
        const testCases = [
          { 
            url: 'https://techcrunch.com/2024/01/01/breaking-news', 
            title: 'Breaking: Latest Technology News Update',
            expected: 'News' 
          },
          { 
            url: 'https://example.com/news/article', 
            title: 'Political Analysis and Current Events',
            expected: 'News' 
          },
          {
            url: 'https://blog.example.com/2024/01/headlines',
            title: 'Today\'s Headlines and Reports',
            expected: 'News'
          }
        ];
        
        for (const testCase of testCases) {
          const result = classifier.classifySite(testCase.url, testCase.title);
          if (result.category !== testCase.expected) {
            throw new Error(`Expected ${testCase.url} to be classified as ${testCase.expected}, got ${result.category}`);
          }
        }
      }
    },
    
    {
      name: 'Should classify shopping sites using keywords',
      async test() {
        const classifier = new SiteClassifier();
        
        const testCases = [
          { 
            url: 'https://shop.example.com/products/laptop', 
            title: 'Buy Best Laptop Deals and Discounts',
            expected: 'Shopping' 
          },
          { 
            url: 'https://example.com/cart/checkout', 
            title: 'Shopping Cart - Purchase Items',
            expected: 'Shopping' 
          },
          {
            url: 'https://store.example.com/sale',
            title: 'Special Offer - 50% Discount on Electronics',
            expected: 'Shopping'
          }
        ];
        
        for (const testCase of testCases) {
          const result = classifier.classifySite(testCase.url, testCase.title);
          if (result.category !== testCase.expected) {
            throw new Error(`Expected ${testCase.url} to be classified as ${testCase.expected}, got ${result.category}`);
          }
        }
      }
    },
    
    {
      name: 'Should classify social sites using keywords',
      async test() {
        const classifier = new SiteClassifier();
        
        const testCases = [
          { 
            url: 'https://example.com/profile/user123', 
            title: 'John Doe - Social Profile and Posts',
            expected: 'Social' 
          },
          { 
            url: 'https://community.example.com/forum/discussion', 
            title: 'Community Discussion Forum',
            expected: 'Social' 
          },
          {
            url: 'https://example.com/chat/messages',
            title: 'Chat Messages and Conversations',
            expected: 'Social'
          }
        ];
        
        for (const testCase of testCases) {
          const result = classifier.classifySite(testCase.url, testCase.title);
          if (result.category !== testCase.expected) {
            throw new Error(`Expected ${testCase.url} to be classified as ${testCase.expected}, got ${result.category}`);
          }
        }
      }
    },
    
    {
      name: 'Should classify entertainment sites using keywords',
      async test() {
        const classifier = new SiteClassifier();
        
        const testCases = [
          { 
            url: 'https://example.com/watch/movie123', 
            title: 'Watch Latest Movies and TV Shows',
            expected: 'Entertainment' 
          },
          { 
            url: 'https://music.example.com/album/rock', 
            title: 'Rock Music Album Playlist',
            expected: 'Entertainment' 
          },
          {
            url: 'https://gaming.example.com/play/adventure',
            title: 'Play Adventure Games Online',
            expected: 'Entertainment'
          }
        ];
        
        for (const testCase of testCases) {
          const result = classifier.classifySite(testCase.url, testCase.title);
          if (result.category !== testCase.expected) {
            throw new Error(`Expected ${testCase.url} to be classified as ${testCase.expected}, got ${result.category}`);
          }
        }
      }
    },
    
    {
      name: 'Should classify education sites using keywords',
      async test() {
        const classifier = new SiteClassifier();
        
        const testCases = [
          { 
            url: 'https://university.edu/course/computer-science', 
            title: 'Computer Science Course - University',
            expected: 'Education' 
          },
          { 
            url: 'https://learn.example.com/tutorial/python', 
            title: 'Learn Python Programming Tutorial',
            expected: 'Education' 
          },
          {
            url: 'https://academy.example.com/certification',
            title: 'Online Certification Program',
            expected: 'Education'
          }
        ];
        
        for (const testCase of testCases) {
          const result = classifier.classifySite(testCase.url, testCase.title);
          if (result.category !== testCase.expected) {
            throw new Error(`Expected ${testCase.url} to be classified as ${testCase.expected}, got ${result.category}`);
          }
        }
      }
    },
    
    {
      name: 'Should handle TLD-based classification',
      async test() {
        const classifier = new SiteClassifier();
        
        const testCases = [
          { 
            url: 'https://example.gov/services', 
            title: 'Government Services',
            expected: 'Reference' 
          },
          { 
            url: 'https://university.edu/about', 
            title: 'About the University',
            expected: 'Education' 
          },
          {
            url: 'https://nonprofit.org/mission',
            title: 'Our Mission Statement',
            expected: 'Reference'
          }
        ];
        
        for (const testCase of testCases) {
          const result = classifier.classifySite(testCase.url, testCase.title);
          if (result.category !== testCase.expected) {
            throw new Error(`Expected ${testCase.url} to be classified as ${testCase.expected}, got ${result.category}`);
          }
        }
      }
    },
    
    {
      name: 'Should learn from user actions and apply preferences',
      async test() {
        const classifier = new SiteClassifier();
        
        // Clear any existing user data
        classifier.userCategories.clear();
        
        // Teach it a custom classification
        await classifier.learnFromUserAction('https://mycompany.com/dashboard', 'Productivity');
        
        // Check if it learned (should have highest confidence)
        const result = classifier.classifySite('https://mycompany.com/dashboard', 'Company Dashboard');
        if (result.category !== 'Productivity') {
          throw new Error(`Expected learned classification 'Productivity', got ${result.category}`);
        }
        if (result.confidence !== 1.0) {
          throw new Error(`Expected confidence 1.0 for user preference, got ${result.confidence}`);
        }
      }
    },
    
    {
      name: 'Should handle mixed keyword scenarios',
      async test() {
        const classifier = new SiteClassifier();
        
        // Test URL with multiple category keywords
        const result = classifier.classifySite(
          'https://tech-news.com/programming/javascript/tutorial', 
          'JavaScript Programming Tutorial - Latest Tech News'
        );
        
        // Should classify based on strongest keyword matches
        if (!['Development', 'News', 'Education'].includes(result.category)) {
          throw new Error(`Expected Development, News, or Education, got ${result.category}`);
        }
        
        if (result.confidence < 0.5) {
          throw new Error(`Expected reasonable confidence, got ${result.confidence}`);
        }
      }
    },
    
    {
      name: 'Should provide fallback categories for unknown content',
      async test() {
        const classifier = new SiteClassifier();
        
        const result = classifier.classifySite(
          'https://random-unknown-site-xyz789.com/page', 
          'Random Page with No Clear Category'
        );
        
        if (result.category !== 'Other') {
          throw new Error(`Expected 'Other' for unknown content, got ${result.category}`);
        }
        
        if (result.confidence > 0.5) {
          throw new Error(`Expected low confidence for unknown content, got ${result.confidence}`);
        }
      }
    },
    
    {
      name: 'Should export and import user customizations',
      async test() {
        const classifier = new SiteClassifier();
        
        // Clear existing data
        classifier.userCategories.clear();
        
        // Add custom classifications
        await classifier.learnFromUserAction('https://work1.com', 'Work');
        await classifier.learnFromUserAction('https://hobby1.com', 'Hobbies');
        
        // Export
        const exportedData = await classifier.exportUserData();
        
        // Verify export structure
        if (!exportedData.userCategories) {
          throw new Error('Export missing userCategories');
        }
        
        // Create new classifier and import
        const newClassifier = new SiteClassifier();
        newClassifier.userCategories.clear();
        
        await newClassifier.importUserData(exportedData);
        
        // Verify imports
        const result1 = newClassifier.classifySite('https://work1.com');
        const result2 = newClassifier.classifySite('https://hobby1.com');
        
        if (result1.category !== 'Work' || result2.category !== 'Hobbies') {
          throw new Error('Import/export failed to preserve user customizations');
        }
      }
    },
    
    {
      name: 'Should provide suggested categories',
      async test() {
        const classifier = new SiteClassifier();
        
        const suggestions = classifier.getSuggestedCategories();
        
        if (!Array.isArray(suggestions)) {
          throw new Error('getSuggestedCategories should return an array');
        }
        
        // Should include built-in categories
        const expectedCategories = ['Development', 'News', 'Shopping', 'Social', 'Entertainment', 'Education', 'Reference', 'Productivity', 'Other'];
        
        for (const category of expectedCategories) {
          if (!suggestions.includes(category)) {
            throw new Error(`Missing expected category: ${category}`);
          }
        }
      }
    },
    
    {
      name: 'Should handle enhanced classification with page fetch',
      async test() {
        const classifier = new SiteClassifier();
        
        // Test the enhanced classification method
        const result = await classifier.classifyWithPageFetch(
          'https://github.com/user/repo',
          'My JavaScript Project - Advanced React Components'
        );
        
        if (result.category !== 'Development') {
          throw new Error(`Expected Development classification, got ${result.category}`);
        }
        
        if (result.confidence < 0.5) {
          throw new Error(`Expected high confidence, got ${result.confidence}`);
        }
      }
    },
    
    {
      name: 'Should handle error cases gracefully',
      async test() {
        const classifier = new SiteClassifier();
        
        // Test with invalid URL
        const result = classifier.classifySite('not-a-valid-url', 'Some Title');
        
        if (result.category !== 'Other') {
          throw new Error(`Expected 'Other' for invalid URL, got ${result.category}`);
        }
        
        if (result.confidence > 0.2) {
          throw new Error(`Expected very low confidence for invalid URL, got ${result.confidence}`);
        }
      }
    },
    
    {
      name: 'Should respect confidence levels based on keyword matches',
      async test() {
        const classifier = new SiteClassifier();
        
        // Many matching keywords should give high confidence
        const highConfidenceResult = classifier.classifySite(
          'https://dev.example.com/api/documentation/tutorial',
          'JavaScript Programming API Documentation Tutorial for Developers'
        );
        
        // Few matching keywords should give lower confidence
        const lowConfidenceResult = classifier.classifySite(
          'https://example.com/page',
          'Simple Page'
        );
        
        if (highConfidenceResult.confidence <= lowConfidenceResult.confidence) {
          throw new Error('High keyword match should have higher confidence than low keyword match');
        }
        
        if (highConfidenceResult.confidence < 0.7) {
          throw new Error(`Expected high confidence for many keyword matches, got ${highConfidenceResult.confidence}`);
        }
      }
    }
  ]
}; 