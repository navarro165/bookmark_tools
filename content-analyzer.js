class ContentAnalyzer {
  constructor() {
    this.analysisCache = new Map();
    this.batchSize = 10;
    this.rateLimitDelay = 100; // ms between batches
    this.siteClassifier = null; // Will be set by popup.js
    this.enablePageFetch = false; // User preference for page fetching
  }

  setSiteClassifier(classifier) {
    this.siteClassifier = classifier;
  }

  async analyzeBookmarks(bookmarks, onProgress) {
    let bookmarksToAnalyze;
    
    if (this.enablePageFetch) {
      // When page fetching is enabled, analyze ALL bookmarks for better accuracy
      bookmarksToAnalyze = bookmarks.filter(bookmark => bookmark.url);
    } else {
      // When page fetching is disabled, only analyze unknown bookmarks
      bookmarksToAnalyze = bookmarks.filter(bookmark => 
        bookmark.url && this.needsAnalysis(bookmark.url, bookmark.title)
      );
    }

    if (bookmarksToAnalyze.length === 0) {
      return [];
    }

    const analysisType = this.enablePageFetch ? 'with page fetching' : 'unknown';
    onProgress(`Analyzing ${bookmarksToAnalyze.length} bookmarks ${analysisType}...`);

    // Process in batches for better performance
    const results = [];
    const batches = this.createBatches(bookmarksToAnalyze, this.batchSize);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      onProgress(`Processing batch ${i + 1} of ${batches.length}...`);
      
      const batchResults = await Promise.all(
        batch.map(bookmark => this.analyzeBookmark(bookmark, onProgress))
      );
      
      results.push(...batchResults);
      
      // Rate limiting between batches
      if (i < batches.length - 1) {
        await this.delay(this.rateLimitDelay);
      }
    }

    return results;
  }

  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  needsAnalysis(url, title) {
    if (this.analysisCache.has(url)) {
      return false;
    }

    try {
      const domain = new URL(url).hostname.replace('www.', '').toLowerCase();
      
      // If page fetching is enabled, be less restrictive about analysis
      if (this.enablePageFetch) {
        // Only skip the most obvious well-known sites
        const veryWellKnownPatterns = [
          /^(google|microsoft|apple|facebook|amazon|wikipedia)\./i,
          /\.(gov|mil)$/i
        ];
        
        return !veryWellKnownPatterns.some(pattern => pattern.test(domain));
      }
      
      // Original behavior when page fetching is disabled
      const wellKnownPatterns = [
        /^(github|gitlab|bitbucket|stackoverflow|reddit|youtube|facebook|twitter|amazon|wikipedia|google|microsoft|apple)\./i,
        /\.(gov|edu|mil)$/i
      ];
      
      return !wellKnownPatterns.some(pattern => pattern.test(domain));
    } catch {
      return false;
    }
  }

  async analyzeBookmark(bookmark, onProgress) {
    if (this.analysisCache.has(bookmark.url)) {
      return this.analysisCache.get(bookmark.url);
    }

    try {
      const analysis = await this.performAnalysis(bookmark.url, bookmark.title, onProgress);
      
      const result = {
        bookmark,
        category: analysis.category,
        confidence: analysis.confidence,
        description: analysis.description,
        suggestedTags: analysis.tags || []
      };
      
      this.analysisCache.set(bookmark.url, result);
      return result;
    } catch (error) {
      console.warn(`Failed to analyze ${bookmark.url}:`, error);
      return null;
    }
  }

  async performAnalysis(url, title, onProgress) {
    // When page fetching is enabled, try it for ALL sites for better accuracy
    if (this.siteClassifier && this.enablePageFetch) {
      if (onProgress) {
        onProgress(`Fetching page data for ${new URL(url).hostname}...`);
      }
      
      const classifierResult = await this.siteClassifier.classifyWithPageFetch(url, title);
      
      // Use the page fetch result even if confidence is lower, since we specifically enabled fetching
      if (classifierResult.confidence > 0.3) {
        return {
          category: classifierResult.category,
          confidence: classifierResult.confidence,
          description: 'Categorized using keyword patterns and page data',
          tags: this.extractTags(url, title)
        };
      }
    }
    
    // If page fetching is disabled or failed, fall back to pattern analysis
    const urlAnalysis = this.analyzeURL(url);
    const titleAnalysis = this.analyzeTitle(title);
    const domainAnalysis = this.analyzeDomain(url);
    const contentTypeAnalysis = this.analyzeContentType(url, title);

    // Combine analyses with weighted scoring
    const analyses = [
      { ...urlAnalysis, weight: 0.3 },
      { ...titleAnalysis, weight: 0.25 },
      { ...domainAnalysis, weight: 0.35 },
      { ...contentTypeAnalysis, weight: 0.1 }
    ].filter(a => a && a.confidence > 0);

    if (analyses.length === 0) {
      return this.getDefaultAnalysis(url);
    }

    // Calculate weighted average
    let totalWeight = 0;
    let weightedScore = 0;
    let bestCategory = null;
    let bestConfidence = 0;

    for (const analysis of analyses) {
      const score = analysis.confidence * analysis.weight;
      weightedScore += score;
      totalWeight += analysis.weight;
      
      if (analysis.confidence > bestConfidence) {
        bestConfidence = analysis.confidence;
        bestCategory = analysis.category;
      }
    }

    const finalConfidence = totalWeight > 0 ? weightedScore / totalWeight : 0;

    return {
      category: bestCategory,
      confidence: finalConfidence,
      description: 'Automatic categorization based on URL patterns and content analysis',
      tags: this.extractTags(url, title)
    };
  }

  analyzeURL(url) {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.toLowerCase();
      const params = urlObj.searchParams;
      
      // Enhanced URL pattern matching
      const patterns = [
        // E-commerce
        { 
          regex: /\/(shop|store|buy|cart|checkout|product|item|catalog|purchase)/i,
          category: 'Shopping',
          confidence: 0.9
        },
        // Documentation
        {
          regex: /\/(docs?|documentation|api|reference|guide|tutorial|manual|help)/i,
          category: 'Development',
          confidence: 0.85
        },
        // News/Articles
        {
          regex: /\/(news|article|story|post|blog)|\d{4}\/\d{2}\/\d{2}/i,
          category: 'News',
          confidence: 0.8
        },
        // Media
        {
          regex: /\/(watch|video|stream|player|embed|media)/i,
          category: 'Entertainment',
          confidence: 0.85
        },
        // Social
        {
          regex: /\/(profile|user|@|u\/|community|group|forum)/i,
          category: 'Social',
          confidence: 0.8
        },
        // Development
        {
          regex: /\/(repo|repository|code|source|git|issues|pull|merge)/i,
          category: 'Development',
          confidence: 0.9
        },
        // Learning
        {
          regex: /\/(course|lesson|learn|tutorial|education|training)/i,
          category: 'Education',
          confidence: 0.85
        }
      ];

      for (const pattern of patterns) {
        if (pattern.regex.test(path)) {
          return {
            category: pattern.category,
            confidence: pattern.confidence
          };
        }
      }

      // Check query parameters
      if (params.has('search') || params.has('q') || params.has('query')) {
        return {
          category: 'Search/Results',
          confidence: 0.7
        };
      }

    } catch (error) {
      console.warn('URL analysis failed:', error);
    }

    return { confidence: 0 };
  }

  analyzeTitle(title) {
    if (!title) return { confidence: 0 };

    const lowerTitle = title.toLowerCase();
    
    // Enhanced title patterns with categories
    const titlePatterns = [
      // Development
      {
        keywords: ['api', 'sdk', 'framework', 'library', 'npm', 'package', 'module', 'function', 'class', 'method'],
        category: 'Development',
        confidence: 0.85
      },
      // Tutorial/Learning
      {
        keywords: ['tutorial', 'guide', 'how to', 'learn', 'course', 'lesson', 'explained', 'introduction'],
        category: 'Education',
        confidence: 0.8
      },
      // News
      {
        keywords: ['breaking', 'latest', 'news', 'report', 'update', 'announces', 'reveals'],
        category: 'News',
        confidence: 0.8
      },
      // Shopping
      {
        keywords: ['buy', 'shop', 'sale', 'discount', 'price', 'deal', 'offer', 'review'],
        category: 'Shopping',
        confidence: 0.75
      },
      // Entertainment
      {
        keywords: ['watch', 'stream', 'movie', 'show', 'episode', 'season', 'trailer'],
        category: 'Entertainment',
        confidence: 0.8
      },
      // Technical
      {
        keywords: ['error', 'bug', 'issue', 'problem', 'solution', 'fix', 'resolved'],
        category: 'Development',
        confidence: 0.75
      }
    ];

    for (const pattern of titlePatterns) {
      const matchCount = pattern.keywords.filter(keyword => lowerTitle.includes(keyword)).length;
      if (matchCount > 0) {
        // Confidence increases with more keyword matches
        const adjustedConfidence = Math.min(pattern.confidence + (matchCount - 1) * 0.05, 0.95);
        return {
          category: pattern.category,
          confidence: adjustedConfidence
        };
      }
    }

    return { confidence: 0 };
  }

  analyzeDomain(url) {
    try {
      const domain = new URL(url).hostname.replace('www.', '').toLowerCase();
      
      // Domain pattern analysis
      const domainPatterns = [
        // Code repositories
        {
          pattern: /github|gitlab|bitbucket|sourceforge|codeberg/i,
          category: 'Development',
          confidence: 0.95
        },
        // Educational
        {
          pattern: /\.edu$|academy|university|college|school|coursera|udemy|edx/i,
          category: 'Education',
          confidence: 0.9
        },
        // Government
        {
          pattern: /\.gov$|\.mil$|government|federal|state\./i,
          category: 'Reference',
          confidence: 0.95
        },
        // News
        {
          pattern: /news|times|post|herald|gazette|tribune|journal|bbc|cnn|reuters/i,
          category: 'News',
          confidence: 0.85
        },
        // Technology
        {
          pattern: /tech|stack|overflow|developer|programming|coding/i,
          category: 'Development',
          confidence: 0.8
        },
        // Shopping
        {
          pattern: /shop|store|buy|market|amazon|ebay|etsy|alibaba/i,
          category: 'Shopping',
          confidence: 0.85
        },
        // Social
        {
          pattern: /social|facebook|twitter|instagram|linkedin|reddit|forum/i,
          category: 'Social',
          confidence: 0.85
        }
      ];

      for (const { pattern, category, confidence } of domainPatterns) {
        if (pattern.test(domain)) {
          return { category, confidence };
        }
      }

      // TLD-based categorization
      if (domain.endsWith('.org')) {
        return {
          category: 'Reference',
          confidence: 0.7
        };
      }

      if (domain.endsWith('.io') || domain.endsWith('.dev')) {
        return {
          category: 'Development',
          confidence: 0.75
        };
      }

    } catch (error) {
      console.warn('Domain analysis failed:', error);
    }

    return { confidence: 0 };
  }

  analyzeContentType(url, title) {
    const combined = `${url} ${title}`.toLowerCase();
    
    // Content type patterns
    const contentTypes = [
      {
        pattern: /\.(pdf|doc|docx|ppt|pptx|xls|xlsx)/i,
        category: 'Documents',
        confidence: 0.9
      },
      {
        pattern: /\.(jpg|jpeg|png|gif|svg|webp)|image|photo|picture/i,
        category: 'Media',
        confidence: 0.85
      },
      {
        pattern: /\.(mp4|avi|mov|wmv|flv)|video|watch|stream/i,
        category: 'Media',
        confidence: 0.85
      },
      {
        pattern: /\.(mp3|wav|flac|ogg)|music|song|album|playlist/i,
        category: 'Media',
        confidence: 0.85
      },
      {
        pattern: /\.(zip|rar|7z|tar|gz)|download|software|app/i,
        category: 'Downloads',
        confidence: 0.8
      }
    ];

    for (const { pattern, category, confidence } of contentTypes) {
      if (pattern.test(combined)) {
        return { category, confidence };
      }
    }

    return { confidence: 0 };
  }

  extractTags(url, title) {
    const tags = new Set();
    const combined = `${url} ${title}`.toLowerCase();
    
    // Technology tags
    const techTags = ['javascript', 'python', 'java', 'react', 'vue', 'angular', 'node', 'docker', 'kubernetes'];
    techTags.forEach(tag => {
      if (combined.includes(tag)) tags.add(tag);
    });
    
    // Topic tags
    const topicTags = ['tutorial', 'guide', 'documentation', 'api', 'news', 'blog', 'video', 'course'];
    topicTags.forEach(tag => {
      if (combined.includes(tag)) tags.add(tag);
    });
    
    // Extract year if present
    const yearMatch = combined.match(/\b(20\d{2})\b/);
    if (yearMatch) tags.add(yearMatch[1]);
    
    return Array.from(tags);
  }

  getDefaultAnalysis(url) {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      
      return {
        category: 'Other',
        confidence: 0.5,
        description: 'Default categorization based on domain',
        tags: []
      };
    } catch {
      return {
        category: 'Other',
        confidence: 0.1,
        description: 'Invalid URL',
        tags: []
      };
    }
  }

  getDomainCategory(domain) {
    const parts = domain.split('.');
    const mainPart = parts[0] || domain;
    const clean = mainPart.replace(/[^a-zA-Z]/g, '');
    
    if (clean.length > 2) {
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    }
    
    return 'Uncategorized';
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Clear cache to free memory
  clearCache() {
    this.analysisCache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.analysisCache.size,
      memoryUsage: this.estimateCacheMemory()
    };
  }

  estimateCacheMemory() {
    // Rough estimation: ~500 bytes per cached entry
    return (this.analysisCache.size * 500) / 1024 / 1024; // MB
  }
}