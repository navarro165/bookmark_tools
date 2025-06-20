class BookmarkSearch {
  constructor(bookmarkOrganizer) {
    this.organizer = bookmarkOrganizer;
    this.allBookmarks = [];
    this.searchIndex = new Map();
    this.currentQuery = '';
    this.selectedIndex = -1;
    this.searchResults = [];
    this.searchTimeout = null;
    
    this.setupEventListeners();
  }

  async initialize() {
    await this.buildSearchIndex();
  }

  async buildSearchIndex() {
    this.allBookmarks = [];
    this.searchIndex.clear();
    
    if (!this.organizer.bookmarkTree) return;
    
    // Extract all bookmarks with their paths
    this.extractBookmarksWithPaths(this.organizer.bookmarkTree, '');
    
    // Build search index
    for (const bookmark of this.allBookmarks) {
      this.indexBookmark(bookmark);
    }
  }

  extractBookmarksWithPaths(node, currentPath) {
    if (node.type === 'bookmark') {
      this.allBookmarks.push({
        id: node.id,
        title: node.title || 'Untitled',
        url: node.url || '',
        path: currentPath,
        dateAdded: node.dateAdded,
        parentId: node.parentId
      });
    } else if (node.type === 'folder' && node.children) {
      const folderPath = currentPath ? `${currentPath} > ${node.title}` : node.title;
      
      for (const child of node.children) {
        this.extractBookmarksWithPaths(child, folderPath);
      }
    }
  }

  indexBookmark(bookmark) {
    const searchableText = [
      bookmark.title,
      bookmark.url,
      bookmark.path,
      this.extractDomain(bookmark.url),
      this.extractKeywords(bookmark.title),
      this.extractKeywords(bookmark.url)
    ].filter(Boolean).join(' ').toLowerCase();
    
    this.searchIndex.set(bookmark.id, {
      bookmark,
      searchText: searchableText,
      tokens: this.tokenize(searchableText)
    });
  }

  extractDomain(url) {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return '';
    }
  }

  extractKeywords(text) {
    if (!text) return '';
    
    // Extract meaningful words (remove common words, special chars)
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.includes(word))
      .join(' ');
  }

  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 0);
  }

  setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    if (!searchInput) return;

    // Search input event
    searchInput.addEventListener('input', (e) => {
      this.handleSearch(e.target.value);
    });

    // Keyboard navigation
    searchInput.addEventListener('keydown', (e) => {
      this.handleKeyNavigation(e);
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-container')) {
        this.hideResults();
      }
    });

    // Focus to show recent results
    searchInput.addEventListener('focus', () => {
      if (this.currentQuery.trim() && this.searchResults.length > 0) {
        this.showResults();
      }
    });
  }

  handleSearch(query) {
    this.currentQuery = query.trim();
    
    // Clear previous timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Debounce search
    this.searchTimeout = setTimeout(() => {
      this.performSearch();
    }, 150);
  }

  async performSearch() {
    if (this.currentQuery.length === 0) {
      this.hideResults();
      return;
    }

    if (this.currentQuery.length < 2) {
      this.showStatus('Type at least 2 characters to search');
      return;
    }

    this.showLoading();
    
    // Ensure search index is built
    if (this.searchIndex.size === 0) {
      await this.buildSearchIndex();
    }

    // Perform the search
    const results = this.searchBookmarks(this.currentQuery);
    this.searchResults = results;
    this.selectedIndex = -1;
    
    this.displayResults(results);
  }

  searchBookmarks(query) {
    const queryLower = query.toLowerCase();
    const queryTokens = this.tokenize(query);
    const results = [];

    for (const [bookmarkId, indexData] of this.searchIndex) {
      const score = this.calculateRelevanceScore(indexData, queryLower, queryTokens);
      
      if (score > 0) {
        results.push({
          ...indexData.bookmark,
          score,
          highlights: this.findHighlights(indexData, queryLower)
        });
      }
    }

    // Sort by relevance score (highest first)
    return results.sort((a, b) => b.score - a.score).slice(0, 50);
  }

  calculateRelevanceScore(indexData, query, queryTokens) {
    const { bookmark, searchText, tokens } = indexData;
    let score = 0;

    // Exact matches get highest score
    if (searchText.includes(query)) {
      score += 100;
      
      // Title exact match bonus
      if (bookmark.title.toLowerCase().includes(query)) {
        score += 50;
      }
      
      // Path exact match bonus (folder/category match)
      if (bookmark.path.toLowerCase().includes(query)) {
        score += 75;
      }
    }

    // Token-based matching
    let tokenMatches = 0;
    for (const queryToken of queryTokens) {
      for (const token of tokens) {
        if (token.includes(queryToken) || queryToken.includes(token)) {
          tokenMatches++;
          score += 10;
          
          // Bonus for exact token match
          if (token === queryToken) {
            score += 20;
          }
          
          // Bonus for title token match
          if (bookmark.title.toLowerCase().includes(queryToken)) {
            score += 15;
          }
        }
      }
    }

    // Coverage bonus (how many query tokens matched)
    const coverage = tokenMatches / Math.max(queryTokens.length, 1);
    score += coverage * 30;

    // Domain match bonus
    const domain = this.extractDomain(bookmark.url);
    if (domain && domain.includes(query)) {
      score += 40;
    }

    // Recency bonus (newer bookmarks get slight preference)
    if (bookmark.dateAdded) {
      const daysSinceAdded = (Date.now() - bookmark.dateAdded) / (1000 * 60 * 60 * 24);
      if (daysSinceAdded < 30) {
        score += 5;
      }
    }

    return score;
  }

  findHighlights(indexData, query) {
    const highlights = {
      title: this.highlightText(indexData.bookmark.title, query),
      url: this.highlightText(indexData.bookmark.url, query),
      path: this.highlightText(indexData.bookmark.path, query)
    };

    return highlights;
  }

  highlightText(text, query) {
    if (!text || !query) return text;
    
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<span class=\"search-highlight\">$1</span>');
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
  }

  displayResults(results) {
    const resultsContainer = document.getElementById('searchResults');
    
    if (results.length === 0) {
      resultsContainer.innerHTML = '<div class=\"search-no-results\">No bookmarks found for \"' + this.escapeHtml(this.currentQuery) + '\"</div>';
      this.showResults();
      return;
    }

    let html = '';
    results.forEach((result, index) => {
      html += `
        <div class=\"search-result-item\" data-index=\"${index}\" data-url=\"${this.escapeHtml(result.url)}\">
          <div class=\"search-result-title\">
            <span class=\"bookmark-icon\">🔗</span>
            ${result.highlights.title || this.escapeHtml(result.title)}
          </div>
          <div class=\"search-result-url\">${result.highlights.url || this.escapeHtml(result.url)}</div>
          <div class=\"search-result-path\">📁 ${result.highlights.path || this.escapeHtml(result.path)}</div>
        </div>
      `;
    });

    resultsContainer.innerHTML = html;
    this.attachResultListeners();
    this.showResults();
  }

  attachResultListeners() {
    const resultItems = document.querySelectorAll('.search-result-item');
    
    resultItems.forEach((item, index) => {
      item.addEventListener('click', () => {
        const url = item.dataset.url;
        this.openBookmark(url);
      });

      item.addEventListener('mouseenter', () => {
        this.selectedIndex = index;
        this.updateSelection();
      });
    });
  }

  handleKeyNavigation(e) {
    const resultItems = document.querySelectorAll('.search-result-item');
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, resultItems.length - 1);
        this.updateSelection();
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        this.updateSelection();
        break;
        
      case 'Enter':
        e.preventDefault();
        if (this.selectedIndex >= 0 && resultItems[this.selectedIndex]) {
          const url = resultItems[this.selectedIndex].dataset.url;
          this.openBookmark(url);
        }
        break;
        
      case 'Escape':
        this.hideResults();
        document.getElementById('searchInput').blur();
        break;
    }
  }

  updateSelection() {
    const resultItems = document.querySelectorAll('.search-result-item');
    
    resultItems.forEach((item, index) => {
      if (index === this.selectedIndex) {
        item.classList.add('selected');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('selected');
      }
    });
  }

  openBookmark(url) {
    if (url) {
      // Use the tabs API to open in new tab
      browser.tabs.create({ url: url });
      this.hideResults();
      
      // Clear search and close popup
      document.getElementById('searchInput').value = '';
      window.close();
    }
  }

  showResults() {
    document.getElementById('searchResults').classList.add('show');
  }

  hideResults() {
    document.getElementById('searchResults').classList.remove('show');
    this.selectedIndex = -1;
  }

  showLoading() {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '<div class=\"search-loading\">🔍 Searching...</div>';
    this.showResults();
  }

  showStatus(message) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = `<div class=\"search-no-results\">${this.escapeHtml(message)}</div>`;
    this.showResults();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}