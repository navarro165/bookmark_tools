class DuplicateDetector {
  constructor(bookmarkOrganizer) {
    this.organizer = bookmarkOrganizer;
    this.allBookmarks = [];
    this.duplicateGroups = [];
    this.selectedToKeep = new Map(); // duplicateGroupIndex -> Set of bookmarkIds
    this.isAnalyzing = false;
    
    this.setupEventListeners();
  }

  async initialize() {
    await this.buildBookmarkList();
  }

  async buildBookmarkList() {
    this.allBookmarks = [];
    
    if (!this.organizer.bookmarkTree) return;
    
    // Extract all bookmarks with their full information
    this.extractAllBookmarks(this.organizer.bookmarkTree, '');
  }

  extractAllBookmarks(node, currentPath) {
    if (node.type === 'bookmark') {
      this.allBookmarks.push({
        id: node.id,
        title: node.title || 'Untitled',
        url: node.url || '',
        path: currentPath,
        dateAdded: node.dateAdded,
        parentId: node.parentId,
        node: node
      });
    } else if (node.type === 'folder' && node.children) {
      const folderPath = currentPath ? `${currentPath} > ${node.title}` : node.title;
      
      for (const child of node.children) {
        this.extractAllBookmarks(child, folderPath);
      }
    }
  }

  setupEventListeners() {
    const findButton = document.getElementById('findDuplicatesBtn');
    const removeButton = document.getElementById('removeDuplicatesBtn');
    const cancelButton = document.getElementById('cancelDuplicatesBtn');

    if (findButton) {
      findButton.addEventListener('click', () => {
        this.findDuplicates();
      });
    }

    if (removeButton) {
      removeButton.addEventListener('click', () => {
        this.removeDuplicates();
      });
    }

    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        this.hideDuplicateResults();
      });
    }
  }

  async findDuplicates() {
    if (this.isAnalyzing) return;
    
    this.isAnalyzing = true;
    const findButton = document.getElementById('findDuplicatesBtn');
    
    try {
      findButton.disabled = true;
      findButton.textContent = '🔍 Analyzing bookmarks...';
      
      // Ensure bookmark list is built
      await this.buildBookmarkList();
      
      // Find duplicates by exact URL matching
      this.duplicateGroups = this.identifyDuplicates();
      
      if (this.duplicateGroups.length === 0) {
        this.showNoDuplicatesFound();
      } else {
        this.displayDuplicates();
      }
      
    } catch (error) {
      this.organizer.showStatus('Error finding duplicates: ' + error.message, 'error');
    } finally {
      findButton.disabled = false;
      findButton.textContent = '🔍 Find Duplicate Bookmarks';
      this.isAnalyzing = false;
    }
  }

  identifyDuplicates() {
    const urlGroups = new Map();
    
    // Group bookmarks by exact URL (including query params)
    for (const bookmark of this.allBookmarks) {
      if (!bookmark.url) continue; // Skip bookmarks without URLs
      
      const normalizedUrl = this.normalizeUrl(bookmark.url);
      
      if (!urlGroups.has(normalizedUrl)) {
        urlGroups.set(normalizedUrl, []);
      }
      
      urlGroups.get(normalizedUrl).push(bookmark);
    }
    
    // Filter groups that have duplicates (more than 1 bookmark)
    const duplicateGroups = [];
    
    for (const [url, bookmarks] of urlGroups) {
      if (bookmarks.length > 1) {
        // Sort by date added (newest first) and title
        const sortedBookmarks = bookmarks.sort((a, b) => {
          // First by date added (newer first)
          const dateA = a.dateAdded || 0;
          const dateB = b.dateAdded || 0;
          if (dateB !== dateA) {
            return dateB - dateA;
          }
          
          // Then by title length (longer titles often have more info)
          const titleA = a.title || '';
          const titleB = b.title || '';
          if (titleB.length !== titleA.length) {
            return titleB.length - titleA.length;
          }
          
          // Finally alphabetically by title
          return titleA.localeCompare(titleB);
        });
        
        duplicateGroups.push({
          url: url,
          bookmarks: sortedBookmarks,
          selectedToKeep: new Set([sortedBookmarks[0].id]) // Default to first (newest/best) bookmark
        });
      }
    }
    
    return duplicateGroups;
  }

  normalizeUrl(url) {
    try {
      // Parse URL to ensure it's valid
      const urlObj = new URL(url);
      
      // Keep the URL exactly as is, including all query parameters
      // This ensures exact matching as requested
      return url.trim();
      
    } catch (error) {
      // If URL is invalid, use it as-is for exact matching
      return url.trim();
    }
  }

  displayDuplicates() {
    const resultsDiv = document.getElementById('duplicatesResults');
    const summaryDiv = document.getElementById('duplicatesSummary');
    const containerDiv = document.getElementById('duplicatesContainer');
    
    if (!resultsDiv || !summaryDiv || !containerDiv) return;
    
    // Show summary
    const totalDuplicates = this.duplicateGroups.reduce((sum, group) => sum + group.bookmarks.length, 0);
    const duplicatesCount = totalDuplicates - this.duplicateGroups.length; // Subtract the ones we'll keep
    
    summaryDiv.innerHTML = `
      <div class="duplicates-instructions">
        📢 <strong>Instructions:</strong> For each group below, check the boxes next to the bookmarks you want to <strong>KEEP</strong>. 
        Unchecked bookmarks will be deleted. You can keep multiple copies if desired.
      </div>
      Found ${this.duplicateGroups.length} groups with ${totalDuplicates} duplicate bookmarks. 
      Up to ${duplicatesCount} duplicates can be removed.
    `;
    
    // Generate HTML for duplicate groups
    let html = '';
    
    this.duplicateGroups.forEach((group, groupIndex) => {
      html += `
        <div class="duplicate-group">
          <div class="duplicate-group-header">
            🔗 ${this.escapeHtml(group.url)}
            <span style="color: #666; font-weight: normal;">(${group.bookmarks.length} copies)</span>
          </div>
      `;
      
      group.bookmarks.forEach((bookmark, bookmarkIndex) => {
        const isSelected = group.selectedToKeep.has(bookmark.id);
        const statusClass = isSelected ? 'selected' : 'to-delete';
        
        html += `
          <div class="duplicate-item ${statusClass}" data-group="${groupIndex}" data-bookmark="${bookmark.id}">
            <input type="checkbox" 
                   id="duplicate-${groupIndex}-${bookmark.id}" 
                   value="${bookmark.id}" 
                   class="duplicate-checkbox"
                   data-group="${groupIndex}"
                   ${isSelected ? 'checked' : ''}
                   title="Check this bookmark to KEEP it">
            <div class="duplicate-info">
              <div class="duplicate-title">${this.escapeHtml(bookmark.title)}</div>
              <div class="duplicate-url">${this.escapeHtml(bookmark.url)}</div>
              <div class="duplicate-path">📁 ${this.escapeHtml(bookmark.path)}</div>
              ${bookmark.dateAdded ? `<div class="duplicate-path">📅 Added: ${new Date(bookmark.dateAdded).toLocaleDateString()}</div>` : ''}
            </div>
          </div>
        `;
      });
      
      html += '</div>';
    });
    
    containerDiv.innerHTML = html;
    
    // Setup radio button event listeners
    this.setupDuplicateItemListeners();
    
    // Show results
    resultsDiv.classList.add('show');
    
    // Scroll to duplicates results
    this.organizer.scrollToElement('duplicatesResults');
  }

  setupDuplicateItemListeners() {
    const checkboxes = document.querySelectorAll('.duplicate-checkbox');
    
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const groupIndex = parseInt(e.target.dataset.group);
        const bookmarkId = e.target.value;
        
        // Update the selected bookmarks for this group
        if (e.target.checked) {
          this.duplicateGroups[groupIndex].selectedToKeep.add(bookmarkId);
        } else {
          this.duplicateGroups[groupIndex].selectedToKeep.delete(bookmarkId);
        }
        
        // Update visual selection in this group
        this.updateGroupSelection(groupIndex);
      });
    });
  }

  updateGroupSelection(groupIndex) {
    const selectedIds = this.duplicateGroups[groupIndex].selectedToKeep;
    const groupItems = document.querySelectorAll(`.duplicate-item[data-group="${groupIndex}"]`);
    
    groupItems.forEach(item => {
      const bookmarkId = item.dataset.bookmark;
      
      // Remove all status classes first
      item.classList.remove('selected', 'to-delete');
      
      if (selectedIds.has(bookmarkId)) {
        item.classList.add('selected');
      } else {
        item.classList.add('to-delete');
      }
    });
  }

  async removeDuplicates() {
    if (this.duplicateGroups.length === 0) return;
    
    const removeButton = document.getElementById('removeDuplicatesBtn');
    
    try {
      removeButton.disabled = true;
      removeButton.textContent = '🗑️ Removing duplicates...';
      
      let removedCount = 0;
      
      for (const group of this.duplicateGroups) {
        const toKeepIds = group.selectedToKeep;
        
        for (const bookmark of group.bookmarks) {
          if (!toKeepIds.has(bookmark.id)) {
            try {
              await browser.bookmarks.remove(bookmark.id);
              removedCount++;
            } catch (error) {
              console.warn(`Failed to remove bookmark ${bookmark.title}:`, error);
            }
          }
        }
      }
      
      // Show success message
      this.organizer.showStatus(`Successfully removed ${removedCount} duplicate bookmarks!`, 'success');
      
      // Scroll to status message
      this.organizer.scrollToElement('status');
      
      // Hide duplicate results
      this.hideDuplicateResults();
      
      // Refresh the bookmark tree
      await this.organizer.loadFolders();
      
    } catch (error) {
      this.organizer.showStatus('Error removing duplicates: ' + error.message, 'error');
    } finally {
      removeButton.disabled = false;
      removeButton.textContent = '🗑️ Delete All Red Items (Keep Green Ones)';
    }
  }

  showNoDuplicatesFound() {
    const resultsDiv = document.getElementById('duplicatesResults');
    const summaryDiv = document.getElementById('duplicatesSummary');
    const containerDiv = document.getElementById('duplicatesContainer');
    const actionsDiv = document.getElementById('duplicatesActions');
    
    if (!resultsDiv || !summaryDiv || !containerDiv) return;
    
    summaryDiv.innerHTML = `
      <div style="text-align: center; padding: 20px; background-color: #e8f5e8; border-radius: 8px; color: #2e7d32;">
        <div style="font-size: 24px; margin-bottom: 10px;">✅</div>
        <div style="font-weight: bold; font-size: 16px;">No duplicate bookmarks found!</div>
        <div>Your bookmarks are already unique.</div>
      </div>
    `;
    containerDiv.innerHTML = '';
    actionsDiv.style.display = 'none';
    
    resultsDiv.classList.add('show');
    
    // Scroll to duplicates results
    this.organizer.scrollToElement('duplicatesResults');
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
      this.hideDuplicateResults();
    }, 4000);
  }

  hideDuplicateResults() {
    const resultsDiv = document.getElementById('duplicatesResults');
    const actionsDiv = document.getElementById('duplicatesActions');
    
    if (resultsDiv) {
      resultsDiv.classList.remove('show');
    }
    
    if (actionsDiv) {
      actionsDiv.style.display = 'flex';
    }
    
    // Clear data
    this.duplicateGroups = [];
    this.selectedToKeep.clear();
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}