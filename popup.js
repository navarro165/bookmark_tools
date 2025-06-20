// Firefox WebExtension API - browser is provided globally

// Window resize functionality
class WindowResizer {
  constructor() {
    this.init();
  }
  
  async init() {
    await this.loadWindowSize();
    this.setupResizeHandling();
  }
  
  async loadWindowSize() {
    try {
      const stored = await browser.storage.local.get(['windowWidth', 'windowHeight']);
      if (stored.windowWidth && stored.windowHeight) {
        document.body.style.width = stored.windowWidth + 'px';
        document.body.style.minHeight = stored.windowHeight + 'px';
      }
    } catch (error) {
      console.warn('Could not load window size:', error);
    }
  }
  
  setupResizeHandling() {
    // Use ResizeObserver to detect when the body is resized
    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          this.saveWindowSize(entry.contentRect.width, entry.contentRect.height);
        }
      });
      resizeObserver.observe(document.body);
    }
    
    // Also listen for window resize events
    window.addEventListener('resize', () => {
      const rect = document.body.getBoundingClientRect();
      this.saveWindowSize(rect.width, rect.height);
    });
  }
  
  async saveWindowSize(width, height) {
    try {
      await browser.storage.local.set({
        windowWidth: Math.round(width),
        windowHeight: Math.round(height)
      });
    } catch (error) {
      console.warn('Could not save window size:', error);
    }
  }
}

class BookmarkOrganizer {
  constructor() {
    this.selectedFolders = new Set();
    this.allFolders = [];
    this.siteClassifier = new SiteClassifier();
    this.contentAnalyzer = new ContentAnalyzer();
    this.contentAnalyzer.setSiteClassifier(this.siteClassifier);
    this.selectedTargetFolderId = null;
    this.previewedCategories = null;
    this.manualOverrides = new Map();
    this.analysisResults = [];
    this.bookmarkSearch = null;
    this.duplicateDetector = null;
    this.isProcessing = false;
    this.emptyFolders = [];
    this.selectedEmptyFolders = new Set();
    this.windowResizer = new WindowResizer();
    this.bookmarkTree = null;
    this.init();
  }

  async init() {
    try {
      // Initialize search and duplicate detector first
      this.initializeSearch();
      this.initializeDuplicateDetector();
      
      // Load folders and set up event listeners
      await this.loadFolders();
      this.setupEventListeners();
      
      // Load settings last
      await this.loadSettings();
      
    } catch (error) {
      this.showStatus('Failed to initialize extension: ' + error.message, 'error');
    }
  }

  async loadSettings() {
    try {
      const settings = await browser.storage.local.get(['autoBackup', 'theme', 'lastOrganize']);
      if (settings.lastOrganize) {
        const lastDate = new Date(settings.lastOrganize);
        const daysAgo = Math.floor((Date.now() - lastDate) / (1000 * 60 * 60 * 24));
        if (daysAgo > 0) {
          this.showStatus(`Last organized ${daysAgo} days ago`, 'info');
        }
      }
    } catch (error) {
      console.warn('Could not load settings:', error);
    }
  }

  async loadFolders() {
    try {
      const bookmarkTree = await browser.bookmarks.getTree();
      this.bookmarkTree = bookmarkTree[0];
      this.allFolders = this.extractFolders(this.bookmarkTree);
      this.renderFolderTree();
      
      // Update search index when folders are loaded
      if (this.bookmarkSearch) {
        await this.bookmarkSearch.initialize();
      }
      
      // Update duplicate detector when folders are loaded
      if (this.duplicateDetector) {
        await this.duplicateDetector.initialize();
      }
      
      // Update stats
      this.updateStatistics();
    } catch (error) {
      this.showStatus('Error loading folders: ' + error.message, 'error');
      throw error;
    }
  }

  updateStatistics() {
    const totalBookmarks = this.countTotalBookmarks(this.bookmarkTree);
    const totalFolders = this.allFolders.length;
    
    const statsElement = document.getElementById('stats');
    if (statsElement) {
      statsElement.innerHTML = `
        <div class="stats-container">
          <span class="stat-item">📚 ${totalBookmarks} bookmarks</span>
          <span class="stat-item">📁 ${totalFolders} folders</span>
        </div>
      `;
    }
  }

  countTotalBookmarks(node) {
    let count = 0;
    if (node.children) {
      for (const child of node.children) {
        if (child.type === 'bookmark') {
          count++;
        } else if (child.type === 'folder') {
          count += this.countTotalBookmarks(child);
        }
      }
    }
    return count;
  }

  extractFolders(node, path = '') {
    const folders = [];
    
    if (node.type === 'folder' && node.title) {
      const currentPath = path ? `${path}/${node.title}` : node.title;
      folders.push({
        id: node.id,
        title: node.title,
        path: currentPath,
        bookmarkCount: this.countBookmarks(node),
        node: node
      });
    }

    if (node.children) {
      for (const child of node.children) {
        if (child.type === 'folder') {
          const childPath = path ? `${path}/${node.title}` : node.title;
          folders.push(...this.extractFolders(child, childPath));
        }
      }
    }

    return folders;
  }

  countBookmarks(node) {
    let count = 0;
    if (node.children) {
      for (const child of node.children) {
        if (child.type === 'bookmark') {
          count++;
        } else if (child.type === 'folder') {
          count += this.countBookmarks(child);
        }
      }
    }
    return count;
  }

  renderFolderTree() {
    const folderTree = document.getElementById('folderTree');
    folderTree.innerHTML = '';
    
    if (this.bookmarkTree.children) {
      this.bookmarkTree.children.forEach(child => {
        if (child.type === 'folder') {
          const li = this.createTreeNode(child);
          folderTree.appendChild(li);
        }
      });
    }
  }
  
  
  createTreeNode(node, level = 0) {
    const li = document.createElement('li');
    li.className = 'folder-item';
    li.dataset.folderId = node.id;
    
    const hasChildren = node.children && node.children.some(child => child.type === 'folder');
    const bookmarkCount = this.countBookmarks(node);
    const childFolderCount = node.children ? node.children.filter(child => child.type === 'folder').length : 0;
    
    const content = document.createElement('div');
    content.className = 'folder-item-content';
    
    content.innerHTML = `
      <span class="folder-toggle ${hasChildren ? '' : 'empty'}" data-folder-id="${node.id}">
        ${hasChildren ? '▶️' : ''}
      </span>
      <input type="checkbox" class="folder-checkbox" id="folder-${node.id}" data-folder-id="${node.id}">
      <span class="folder-icon">📁</span>
      <span class="folder-name">${this.escapeHtml(node.title)}</span>
      <span class="bookmark-count">(${bookmarkCount} bookmarks${childFolderCount > 0 ? `, ${childFolderCount} folders` : ''})</span>
    `;
    
    li.appendChild(content);
    
    if (hasChildren) {
      const childrenUl = document.createElement('ul');
      childrenUl.className = 'folder-children';
      
      node.children.forEach(child => {
        if (child.type === 'folder') {
          const childLi = this.createTreeNode(child, level + 1);
          childrenUl.appendChild(childLi);
        } else if (child.type === 'bookmark' && level < 2) {
          const bookmarkLi = this.createBookmarkNode(child);
          childrenUl.appendChild(bookmarkLi);
        }
      });
      
      if (node.children.filter(child => child.type === 'bookmark').length > 5 && level < 2) {
        const moreLi = document.createElement('li');
        moreLi.className = 'folder-item is-bookmark';
        moreLi.innerHTML = `
          <div class="folder-item-content">
            <span class="folder-toggle empty"></span>
            <span class="folder-icon">⋯</span>
            <span class="folder-name">...and ${node.children.filter(child => child.type === 'bookmark').length - 5} more bookmarks</span>
          </div>
        `;
        childrenUl.appendChild(moreLi);
      }
      
      li.appendChild(childrenUl);
    }
    
    return li;
  }
  
  
  createBookmarkNode(bookmark) {
    const li = document.createElement('li');
    li.className = 'folder-item is-bookmark';
    
    const title = bookmark.title || 'Untitled';
    const truncatedTitle = title.length > 40 ? title.substring(0, 40) + '...' : title;
    
    li.innerHTML = `
      <div class="folder-item-content">
        <span class="folder-toggle empty"></span>
        <span class="folder-icon">🔗</span>
        <span class="folder-name">${this.escapeHtml(truncatedTitle)}</span>
      </div>
    `;
    
    return li;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  displayFolderContents(folderId) {
    const contentsElement = document.getElementById('folderContents');
    if (!contentsElement) return;

    // Find the folder in the bookmark tree
    const folder = this.findFolderById(this.bookmarkTree, folderId);
    if (!folder) {
      contentsElement.innerHTML = '<div class="no-selection">Folder not found</div>';
      return;
    }

    // Count contents
    const bookmarks = folder.children ? folder.children.filter(child => child.type === 'bookmark') : [];
    const subfolders = folder.children ? folder.children.filter(child => child.type === 'folder') : [];

    let html = `
      <div class="folder-info">
        📁 ${this.escapeHtml(folder.title)} 
        (${bookmarks.length} bookmarks${subfolders.length > 0 ? `, ${subfolders.length} subfolders` : ''})
      </div>
    `;

    if (!folder.children || folder.children.length === 0) {
      html += '<div class="no-selection">This folder is empty</div>';
    } else {
      // Display subfolders first
      if (subfolders.length > 0) {
        html += '<div style="margin-bottom: 12px;"><strong>📁 Subfolders:</strong></div>';
        subfolders.forEach(subfolder => {
          const subBookmarkCount = this.countBookmarks(subfolder);
          const subFolderCount = subfolder.children ? subfolder.children.filter(child => child.type === 'folder').length : 0;
          html += `
            <div class="bookmark-item folder-nav-item" data-folder-id="${subfolder.id}" style="cursor: pointer;">
              <div class="bookmark-title">
                📁 ${this.escapeHtml(subfolder.title)}
              </div>
              <div class="bookmark-url">${subBookmarkCount} bookmarks${subFolderCount > 0 ? `, ${subFolderCount} subfolders` : ''}</div>
            </div>
          `;
        });
      }
      
      // Display bookmarks
      if (bookmarks.length > 0) {
        if (subfolders.length > 0) {
          html += '<div style="margin: 12px 0;"><strong>🔗 Bookmarks:</strong></div>';
        }
        bookmarks.forEach(bookmark => {
          const title = bookmark.title || 'Untitled';
          const url = bookmark.url || '';
          html += `
            <div class="bookmark-item bookmark-nav-item" data-url="${this.escapeHtml(url)}" style="cursor: pointer;">
              <div class="bookmark-title">
                🔗 ${this.escapeHtml(title)}
              </div>
              <div class="bookmark-url">${this.escapeHtml(url)}</div>
            </div>
          `;
        });
      }
    }

    contentsElement.innerHTML = html;
  }

  findFolderById(node, folderId) {
    if (node.id === folderId && node.type === 'folder') {
      return node;
    }
    
    if (node.children) {
      for (const child of node.children) {
        const found = this.findFolderById(child, folderId);
        if (found) return found;
      }
    }
    
    return null;
  }

  setupEventListeners() {
    // Folder tree events
    document.getElementById('folderTree').addEventListener('click', (e) => {
      if (e.target.classList.contains('folder-toggle') && !e.target.classList.contains('empty')) {
        this.toggleFolder(e.target.dataset.folderId);
      } else if (e.target.closest('.folder-item') && !e.target.closest('.folder-item').classList.contains('is-bookmark')) {
        // Handle folder click to display contents
        const folderItem = e.target.closest('.folder-item');
        const folderId = folderItem.dataset.folderId;
        if (folderId) {
          this.displayFolderContents(folderId);
        }
      }
    });
    
    // Double-click to expand folders
    document.getElementById('folderTree').addEventListener('dblclick', (e) => {
      const folderItem = e.target.closest('.folder-item');
      if (folderItem && !folderItem.classList.contains('is-bookmark')) {
        const folderId = folderItem.dataset.folderId;
        const toggle = folderItem.querySelector('.folder-toggle');
        if (toggle && !toggle.classList.contains('empty')) {
          this.toggleFolder(folderId);
        }
      }
    });
    
    
    document.getElementById('folderTree').addEventListener('change', (e) => {
      if (e.target.type === 'checkbox' && e.target.classList.contains('folder-checkbox')) {
        const folderId = e.target.dataset.folderId;
        
        if (e.target.checked) {
          // If this is the first selection, or user wants to change target
          if (this.selectedFolders.size === 0 || this.selectedFolders.has(this.selectedTargetFolderId)) {
            this.selectedFolders.add(folderId);
          } else {
            // Multiple folders selected - add to the set
            this.selectedFolders.add(folderId);
          }
        } else {
          this.selectedFolders.delete(folderId);
        }
        
        this.updateSelectionStats();
      }
    });

    // Folder contents navigation events
    document.getElementById('folderContents').addEventListener('click', (e) => {
      const folderNavItem = e.target.closest('.folder-nav-item');
      const bookmarkNavItem = e.target.closest('.bookmark-nav-item');
      
      if (folderNavItem) {
        const folderId = folderNavItem.dataset.folderId;
        if (folderId) {
          this.displayFolderContents(folderId);
        }
      } else if (bookmarkNavItem) {
        const url = bookmarkNavItem.dataset.url;
        if (url) {
          window.open(url, '_blank');
        }
      }
    });

    // Main action buttons
    document.getElementById('previewBtn').addEventListener('click', () => {
      this.previewCategories();
    });

    // Preview action buttons
    document.getElementById('acceptPreview').addEventListener('click', () => {
      this.acceptPreview();
    });

    document.getElementById('declinePreview').addEventListener('click', () => {
      this.declinePreview();
    });

    // Add export/import functionality
    document.getElementById('exportSettings')?.addEventListener('click', () => {
      this.exportSettings();
    });
    
    document.getElementById('importSettings')?.addEventListener('click', () => {
      this.importSettings();
    });
    
    // Bookmark backup/restore
    document.getElementById('backupBookmarks')?.addEventListener('click', () => {
      this.backupBookmarks();
    });
    
    document.getElementById('restoreBookmarks')?.addEventListener('click', () => {
      this.restoreBookmarks();
    });
    
    // Empty folder detection - main feature
    document.getElementById('findEmptyFoldersBtn')?.addEventListener('click', () => {
      this.findEmptyFolders();
    });
    
    document.getElementById('removeEmptyFoldersBtn')?.addEventListener('click', () => {
      this.removeEmptyFolders();
    });
    
    document.getElementById('cancelEmptyFoldersBtn')?.addEventListener('click', () => {
      this.hideEmptyFoldersResults();
    });
  }

  updateSelectionStats() {
    let totalBookmarks = 0;
    const selectedArray = Array.from(this.selectedFolders);
    
    // Set the first selected folder as target (if any)
    this.selectedTargetFolderId = selectedArray.length > 0 ? selectedArray[0] : null;
    
    for (const folderId of this.selectedFolders) {
      const folder = this.allFolders.find(f => f.id === folderId);
      if (folder) {
        totalBookmarks += folder.bookmarkCount;
      }
    }
    
    const selectionInfo = document.getElementById('selectionInfo');
    if (selectionInfo) {
      if (this.selectedFolders.size === 0) {
        selectionInfo.textContent = 'Select folders to begin organizing';
        selectionInfo.className = '';
      } else if (this.selectedFolders.size === 1) {
        const targetFolder = this.findFolderById(this.bookmarkTree, this.selectedTargetFolderId);
        selectionInfo.innerHTML = `Selected: <strong>1 folder</strong> (${totalBookmarks} bookmarks)<br>📍 Will organize within: <strong>${targetFolder?.title || 'Unknown'}</strong>`;
        selectionInfo.className = 'single-selection';
      } else {
        const targetFolder = this.findFolderById(this.bookmarkTree, this.selectedTargetFolderId);
        selectionInfo.innerHTML = `
          <div class="multi-folder-warning">
            <strong>⚠️ MULTIPLE FOLDERS SELECTED</strong>
          </div>
          <div class="target-info">
            📍 <strong>ALL ${totalBookmarks} bookmarks</strong> from ${this.selectedFolders.size} folders will be moved to:<br>
            <span class="target-folder-name">📁 ${targetFolder?.title || 'Unknown'}</span>
          </div>
          <div class="change-target-hint">
            <strong>💡 Want to organize in a different folder?</strong><br>
            Uncheck all folders, then select your preferred target folder FIRST
          </div>
        `;
        selectionInfo.className = 'multi-selection';
      }
    }
    
    // Update visual indicators
    this.updateTargetFolderHighlight();
  }
  
  updateTargetFolderHighlight() {
    // Remove previous target highlights
    document.querySelectorAll('.target-folder').forEach(el => {
      el.classList.remove('target-folder');
    });
    
    // Highlight the current target folder
    if (this.selectedTargetFolderId) {
      const targetElement = document.querySelector(`#folderTree li[data-folder-id="${this.selectedTargetFolderId}"]`);
      if (targetElement) {
        targetElement.classList.add('target-folder');
      }
    }
  }
  
  toggleFolder(folderId) {
    const folderItem = document.querySelector(`#folderTree li[data-folder-id="${folderId}"]`);
    const toggle = folderItem.querySelector('.folder-toggle');
    const children = folderItem.querySelector('.folder-children');
    
    if (children) {
      const isExpanded = children.classList.contains('expanded');
      
      if (isExpanded) {
        children.classList.remove('expanded');
        toggle.textContent = '▶️';
      } else {
        children.classList.add('expanded');
        toggle.textContent = '🔽';
      }
    }
  }

  async organizeBookmarks() {
    const targetFolderId = this.selectedTargetFolderId;
    if (!targetFolderId) {
      this.showStatus('Please select a target folder first.', 'error');
      return;
    }

    if (this.selectedFolders.size === 0) {
      this.showStatus('Please select folders to organize.', 'error');
      return;
    }

    // Get organization options
    const options = {
      removeDuplicates: document.getElementById('removeDuplicates').checked,
      removeEmptyFolders: document.getElementById('removeEmptyFolders').checked,
      moveBookmarks: document.getElementById('moveBookmarks').checked,
      createDateFolders: false
    };

    // Show confirmation dialog with options
    const sourceFolderNames = Array.from(this.selectedFolders).map(id => {
      const folder = this.findFolderById(this.bookmarkTree, id);
      return folder ? folder.title : id;
    });
    
    let confirmMessage = `You are about to organize bookmarks from:\n`;
    confirmMessage += sourceFolderNames.map(name => `• ${name}`).join('\n');
    confirmMessage += `\n\nOptions:\n`;
    confirmMessage += `• ${options.removeDuplicates ? '✅' : '❌'} Remove duplicate bookmarks\n`;
    confirmMessage += `• ${options.removeEmptyFolders ? '✅' : '❌'} Remove empty source folders after organizing\n`;
    confirmMessage += `• ${options.moveBookmarks ? '✅' : '❌'} Move bookmarks from original location (instead of copying)\n`;
    confirmMessage += `\nProceed with organization?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    this.isProcessing = true;

    try {
      this.showStatus('Organizing bookmarks...', 'loading');

      let totalProcessed = 0;
      const sourceFolderIds = Array.from(this.selectedFolders);
      
      // Collect ALL bookmarks from ALL folders first
      let allBookmarks = [];
      for (const folderId of sourceFolderIds) {
        if (folderId !== targetFolderId) {
          try {
            const bookmarks = await this.getBookmarksFromFolder(folderId);
            allBookmarks = allBookmarks.concat(bookmarks);
          } catch (error) {
            console.warn(`Failed to get bookmarks from folder ${folderId}:`, error);
          }
        }
      }
      
      // Create URI map to track all duplicate locations
      const uriLocationMap = new Map();
      let uniqueBookmarks = [];
      
      if (options.removeDuplicates) {
        // Build map of URI -> list of all bookmark instances with their paths
        for (const bookmark of allBookmarks) {
          const uri = bookmark.url || bookmark.title || 'no-url';
          
          if (!uriLocationMap.has(uri)) {
            uriLocationMap.set(uri, []);
            // Keep the first instance for organizing
            uniqueBookmarks.push(bookmark);
          }
          
          // Track ALL instances for potential removal
          uriLocationMap.get(uri).push({
            id: bookmark.id,
            title: bookmark.title,
            url: bookmark.url,
            parentId: bookmark.parentId
          });
        }
        
        this.showStatus(`Found ${allBookmarks.length} bookmarks, organizing ${uniqueBookmarks.length} unique bookmarks...`, 'loading');
      } else {
        uniqueBookmarks = allBookmarks;
      }
      
      // Process unique bookmarks
      if (uniqueBookmarks.length > 0) {
        totalProcessed = await this.processBookmarks(uniqueBookmarks, targetFolderId, options);
      }
      
      // Remove duplicate instances from original locations if moving bookmarks
      if (options.removeDuplicates && options.moveBookmarks) {
        await this.removeDuplicateInstances(uriLocationMap);
      }
      
      // Track source folders for cleanup
      const sourceFoldersToCheck = new Set();
      for (const folderId of sourceFolderIds) {
        if (folderId !== targetFolderId) {
          sourceFoldersToCheck.add(folderId);
        }
      }

      // Clean up empty source folders if option is enabled
      if (options.removeEmptyFolders && sourceFoldersToCheck.size > 0) {
        await this.cleanupEmptySourceFolders(sourceFoldersToCheck);
      }

      this.showStatus(`Successfully ${options.moveBookmarks ? 'moved' : 'copied'} ${totalProcessed} bookmarks!`, 'success');
      
      // Scroll to results
      this.scrollToPreviewResults();
      
      // Save organization date
      await this.saveOrganizationState();
      
      // Refresh folder tree
      await this.loadFolders();
      
    } catch (error) {
      console.error('Error organizing bookmarks:', error);
      this.showStatus('Error organizing bookmarks: ' + error.message, 'error');
    } finally {
      this.isProcessing = false;
    }
  }

  async getBookmarksFromFolder(folderId) {
    try {
      const folder = await browser.bookmarks.getSubTree(folderId);
      if (!folder || !folder[0]) {
        console.warn(`No folder found for ID: ${folderId}`);
        return [];
      }
      return this.extractBookmarks(folder[0]);
    } catch (error) {
      console.error(`Error getting bookmarks from folder ${folderId}:`, error);
      return [];
    }
  }

  extractBookmarks(node) {
    const bookmarks = [];
    
    if (node.children) {
      for (const child of node.children) {
        if (child.type === 'bookmark') {
          bookmarks.push(child);
        } else if (child.type === 'folder') {
          bookmarks.push(...this.extractBookmarks(child));
        }
      }
    }
    
    return bookmarks;
  }

  async processBookmarks(bookmarks, targetFolderId, options) {
    // Remove duplicate removal here since it's handled at a higher level
    const categorizedBookmarks = this.categorizeBookmarks(bookmarks, options);
    
    let processedCount = 0;
    
    for (const [category, categoryBookmarks] of Object.entries(categorizedBookmarks)) {
      const categoryFolderId = await this.createOrGetCategoryFolder(targetFolderId, category);
      
      for (const bookmark of categoryBookmarks) {
        try {
          if (options.moveBookmarks) {
            // Move bookmark to new location
            await browser.bookmarks.move(bookmark.id, { parentId: categoryFolderId });
          } else {
            // Copy bookmark to new location (create duplicate)
            await browser.bookmarks.create({
              parentId: categoryFolderId,
              title: bookmark.title,
              url: bookmark.url
            });
          }
          processedCount++;
        } catch (error) {
          console.warn(`Failed to ${options.moveBookmarks ? 'move' : 'copy'} bookmark ${bookmark.title}:`, error);
        }
      }
    }
    
    return processedCount;
  }

  categorizeBookmarks(bookmarks, options) {
    const categories = {};
    
    for (const bookmark of bookmarks) {
      let category = 'Other';
      
      if (bookmark.url) {
        const domain = new URL(bookmark.url).hostname.replace('www.', '');
        
        // Check for manual override first
        if (this.manualOverrides.has(domain)) {
          category = this.manualOverrides.get(domain);
        } else {
          // Use the new classifier that returns {category, confidence}
          const result = this.siteClassifier.classifySite(bookmark.url, bookmark.title);
          category = result.category;
        }
      } else {
        category = 'Other';
      }
      
      
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(bookmark);
    }
    
    return categories;
  }

  async previewCategories() {
    const checkedFolders = this.getCheckedFolders();
    if (checkedFolders.length === 0) {
      this.showStatus('Please select at least one folder', 'error');
      return;
    }
    
    // Reset all state to ensure fresh analysis
    this.hideAnalysisDetails();
    this.hidePreviewActions();
    this.analysisResults = [];
    this.previewedCategories = null;
    this.manualOverrides = new Map();
    this.duplicateTrackingMap = null;
    
    this.isProcessing = true;
    this.disableControls();
    
    try {
      this.showStatus('Fetching bookmarks...', 'loading');
      
      const bookmarks = await this.getAllBookmarksFromFolders(checkedFolders);
      
      if (bookmarks.length === 0) {
        this.showStatus('No bookmarks found in selected folders', 'error');
        this.enableControls();
        return;
      }
      
      // Handle duplicates using same logic as organize method
      let processedBookmarks = bookmarks;
      if (document.getElementById('removeDuplicates').checked) {
        const uriLocationMap = new Map();
        processedBookmarks = [];
        
        // Build map of URI -> list of all bookmark instances with their paths
        for (const bookmark of bookmarks) {
          const uri = bookmark.url || bookmark.title || 'no-url';
          
          if (!uriLocationMap.has(uri)) {
            uriLocationMap.set(uri, []);
            // Keep the first instance for organizing
            processedBookmarks.push(bookmark);
          }
          
          // Track ALL instances for potential removal
          uriLocationMap.get(uri).push({
            id: bookmark.id,
            title: bookmark.title,
            url: bookmark.url,
            parentId: bookmark.parentId
          });
        }
        
        // Store the URI map for later use when organizing
        this.duplicateTrackingMap = uriLocationMap;
      }
      
      // Always enable enhanced classification
      this.contentAnalyzer.enablePageFetch = true;
      
      this.showStatus(`Found ${bookmarks.length} bookmarks${processedBookmarks.length !== bookmarks.length ? ` (${processedBookmarks.length} after removing duplicates)` : ''}. Analyzing...`, 'loading');
      
      const onProgress = (message) => {
        this.showStatus(message, 'loading');
        // Scroll to status to make progress visible
        document.getElementById('status')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      };
      
      this.analysisResults = await this.contentAnalyzer.analyzeBookmarks(processedBookmarks, onProgress);
      
      // Update site classifier with analysis results  
      let improvedCount = 0;
      for (const result of this.analysisResults) {
        let finalCategory = result.category;
        
        // Set low confidence results to 'Other'
        if (result.confidence <= 0.5) {
          finalCategory = 'Other';
        }
        
        if (result.confidence > 0.4) {
          await this.siteClassifier.learnFromUserAction(
            result.bookmark.url,
            finalCategory
          );
          improvedCount++;
        }
      }
      
      // Generate final categories using processed bookmarks
      const categorizedBookmarks = this.categorizeBookmarks(processedBookmarks, {
        removeDuplicates: false, // Already handled above
        moveBookmarks: document.getElementById('moveBookmarks').checked,
        createDateFolders: false  // Date folders feature was removed
      });
      const suggestedCategories = Object.keys(categorizedBookmarks).sort();
      this.previewedCategories = { bookmarks: processedBookmarks, categories: suggestedCategories };
      
      this.showCategoryPreview(suggestedCategories, processedBookmarks.length, this.analysisResults);
      
    } catch (error) {
      this.showStatus('Error analyzing bookmarks: ' + error.message, 'error');
    } finally {
      this.enableControls();
      this.isProcessing = false;
    }
  }
  
  showCategoryPreview(categories, totalBookmarks, analysisResults = []) {
    const preview = categories.slice(0, 15).join('\n• ');
    let message = `Found ${totalBookmarks} bookmarks organized into ${categories.length} categories:`;
    
    // Show analysis information
    if (analysisResults.length > 0) {
      message += `\n\n<span class="analyzing">✨ Analyzed ${analysisResults.length} sites for better categorization</span>`;
    }
    
    message += `\n\n<strong>Categories:</strong>\n• ${preview}${categories.length > 15 ? '\n• ...and ' + (categories.length - 15) + ' more categories' : ''}`;
    
    this.showStatus(message, 'success');
    this.showAnalysisDetails();
    this.showPreviewActions();
    
    // Smooth scroll to the preview results
    this.scrollToPreviewResults();
  }
  
  scrollToElement(elementId, offset = 20) {
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element && element.style.display !== 'none') {
        const elementTop = element.offsetTop;
        
        window.scrollTo({
          top: elementTop - offset,
          behavior: 'smooth'
        });
        
        // Add a subtle highlight animation
        element.style.animation = 'highlightPreview 2s ease-out';
        
        setTimeout(() => {
          element.style.animation = '';
        }, 2000);
      }
    }, 100);
  }
  
  scrollToPreviewResults() {
    this.scrollToElement('status');
  }
  
  initializeSearch() {
    try {
      this.bookmarkSearch = new BookmarkSearch(this);
    } catch (error) {
      console.error('Failed to initialize bookmark search:', error);
    }
  }

  initializeDuplicateDetector() {
    try {
      this.duplicateDetector = new DuplicateDetector(this);
    } catch (error) {
      console.error('Failed to initialize duplicate detector:', error);
    }
  }

  removeDuplicateBookmarks(bookmarks) {
    const seen = new Map();
    const unique = [];
    
    for (const bookmark of bookmarks) {
      const key = bookmark.url || bookmark.title;
      if (!seen.has(key)) {
        seen.set(key, true);
        unique.push(bookmark);
      }
    }
    
    return unique;
  }

  async createOrGetCategoryFolder(parentId, categoryPath) {
    const parts = categoryPath.split('/');
    let currentParentId = parentId;
    
    for (const part of parts) {
      const existingFolder = await this.findFolderByName(currentParentId, part);
      if (existingFolder) {
        currentParentId = existingFolder.id;
      } else {
        const newFolder = await browser.bookmarks.create({
          parentId: currentParentId,
          title: part,
          type: 'folder'
        });
        currentParentId = newFolder.id;
      }
    }
    
    return currentParentId;
  }

  async findFolderByName(parentId, name) {
    const children = await browser.bookmarks.getChildren(parentId);
    return children.find(child => child.type === 'folder' && child.title === name);
  }

  showStatus(message, type) {
    const status = document.getElementById('status');
    status.innerHTML = message.replace(/\n/g, '<br>');
    status.className = `status ${type}`;
    status.style.display = 'block';
    
    // Remove timeout - status stays until manually cleared
  }
  
  getCheckedFolders() {
    // Return array of selected folder IDs
    return Array.from(this.selectedFolders);
  }
  
  async getAllBookmarksFromFolders(folderIds) {
    let allBookmarks = [];
    
    for (const folderId of folderIds) {
      const bookmarks = await this.getBookmarksFromFolder(folderId);
      allBookmarks = allBookmarks.concat(bookmarks);
    }
    
    return allBookmarks;
  }
  
  disableControls() {
    document.getElementById('previewBtn').disabled = true;
  }
  
  enableControls() {
    document.getElementById('previewBtn').disabled = false;
  }
  
  showPreviewActions() {
    document.getElementById('previewActions').classList.add('show');
  }
  
  showAnalysisDetails() {
    const detailsDiv = document.getElementById('analysisDetails');
    if (!detailsDiv) return;
    
    // Show details when analysis results are available or we have previewed categories
    const shouldShowDetails = this.analysisResults.length > 0 || this.previewedCategories;
    
    if (!shouldShowDetails) return;

    // Determine what sites to show for review
    let sitesToReview = [];
    
    if (this.previewedCategories) {
      // Show ALL sites for review
      sitesToReview = this.previewedCategories.bookmarks.map(bookmark => {
        // Check if this bookmark was in the analysis results
        const analysisResult = this.analysisResults.find(r => r.bookmark.url === bookmark.url);
        
        if (analysisResult) {
          // Use the analysis result if available
          return analysisResult;
        } else {
          // Create a review entry for well-known sites
          return {
            bookmark: bookmark,
            category: this.siteClassifier.classifySite(bookmark.url, bookmark.title).category,
            confidence: 0.8,
            description: 'Classified using keyword patterns'
          };
        }
      });
    } else {
      // Fallback to analysis results only
      sitesToReview = this.analysisResults;
    }

    // Create header section with count and more informative text
    let headerHtml = `
      <div class="analysis-header">
        <h4>Review and Adjust Categories: (${sitesToReview.length} results)</h4>
        <p class="analysis-subtitle">Review the automatically suggested categories below and make adjustments as needed. Changes will be applied when you accept the preview.</p>
      </div>
    `;
    
    // Create content section
    let contentHtml = '<div class="analysis-content" id="analysisContent">';
    
    // Get all unique categories for dropdown
    const allCategories = this.getAllAvailableCategories();
    
    for (const result of sitesToReview) {
      const domain = new URL(result.bookmark.url).hostname.replace('www.', '');
      
      // Get the category from the classifier for ALL sites
      const classifierResult = this.siteClassifier.classifySite(result.bookmark.url, result.bookmark.title);
      let currentCategory = classifierResult.category;
      
      contentHtml += `
        <div class="analysis-item">
          <div class="site-info">
            <strong>${domain}</strong>
          </div>
          <div class="category-override">
            <select class="category-select-override" data-domain="${domain}">
              ${this.generateCategoryOptions(allCategories, currentCategory)}
            </select>
          </div>
        </div>
      `;
    }
    
    contentHtml += '</div>'; // Close analysis-content
    
    // Add placeholder for the scroll indicator message
    detailsDiv.innerHTML = headerHtml + contentHtml + `<div id="scroll-more-indicator" class="scroll-more-indicator"></div>`;
    detailsDiv.style.display = 'block';
    
    // Setup event listeners for overrides
    this.setupOverrideListeners(sitesToReview);
    this.setupScrollListener();
  }
  
  setupScrollListener() {
    const contentDiv = document.getElementById('analysisContent');
    if (!contentDiv) return;

    // Throttle scroll events for better performance
    let scrollTimeout;
    const throttledUpdate = () => {
      if (scrollTimeout) {
        window.cancelAnimationFrame(scrollTimeout);
      }
      scrollTimeout = window.requestAnimationFrame(() => {
        this.updateScrollIndicator();
      });
    };

    contentDiv.addEventListener('scroll', throttledUpdate);
    
    // Initial check after a short delay for rendering
    setTimeout(() => this.updateScrollIndicator(), 200);
  }

  updateScrollIndicator() {
    const contentDiv = document.getElementById('analysisContent');
    const indicator = document.getElementById('scroll-more-indicator');

    if (!contentDiv || !indicator) return;

    const isScrollable = contentDiv.scrollHeight > contentDiv.clientHeight;

    if (isScrollable) {
      const items = contentDiv.querySelectorAll('.analysis-item');
      const totalItems = items.length;
      const scrollBottom = contentDiv.scrollTop + contentDiv.clientHeight;
      const tolerance = 5; // px tolerance for partially visible items

      let lastVisibleItemIndex = -1;
      for (let i = 0; i < totalItems; i++) {
        const item = items[i];
        if (item.offsetTop + item.offsetHeight <= scrollBottom + tolerance) {
          lastVisibleItemIndex = i;
        } else {
          break; // Items are ordered, so we can stop
        }
      }

      const hiddenItemsCount = totalItems - 1 - lastVisibleItemIndex;

      if (hiddenItemsCount > 0) {
        indicator.textContent = `... and ${hiddenItemsCount} more result${hiddenItemsCount > 1 ? 's' : ''} below ...`;
        indicator.style.display = 'block';
      } else {
        indicator.style.display = 'none'; // Hide when at the bottom
      }
    } else {
      indicator.style.display = 'none';
    }
  }
  
  getAllAvailableCategories() {
    const categories = new Set();
    
    // Add categories from the category rules
    for (const mainCategory of Object.keys(this.siteClassifier.categoryRules)) {
      categories.add(mainCategory);
    }
    
    // Add user's custom categories from site classifier
    if (this.siteClassifier.userCategories) {
      for (const category of this.siteClassifier.userCategories.values()) {
        categories.add(category);
      }
    }
    
    // Add common categories
    const commonCategories = [
      'Other',
      'Personal',
      'Work',
      'Research',
      'Tools'
    ];
    
    commonCategories.forEach(cat => categories.add(cat));
    
    return Array.from(categories).sort();
  }
  
  generateCategoryOptions(categories, selectedCategory) {
    let options = '<option value="">-- Select Category --</option>';
    
    for (const category of categories) {
      const selected = category === selectedCategory ? 'selected' : '';
      options += `<option value="${category}" ${selected}>${category}</option>`;
    }
    
    options += '<option value="__custom__">🆕 Create New Category...</option>';
    return options;
  }
  
  setupOverrideListeners(sitesToReview) {
    // Category select changes
    document.querySelectorAll('.category-select-override').forEach(select => {
      select.addEventListener('change', (e) => {
        const domain = e.target.dataset.domain;
        const selectedValue = e.target.value;
        
        // Find the bookmark URL for this domain
        const bookmark = sitesToReview.find(r => 
          new URL(r.bookmark.url).hostname.replace('www.', '') === domain
        );
        
        if (selectedValue === '__custom__') {
          this.createCustomCategory(domain, select, bookmark?.bookmark.url);
        } else if (selectedValue) {
          // Save to manual overrides for immediate use
          this.manualOverrides.set(domain, selectedValue);
          // Save to site classifier for persistence (need full URL)
          if (bookmark) {
            this.siteClassifier.learnFromUserAction(bookmark.bookmark.url, selectedValue);
          }
        } else {
          this.manualOverrides.delete(domain);
        }
      });
    });
  }
  
  createCustomCategory(domain, selectElement, url = null) {
    const customCategory = prompt('Enter custom category (e.g., "Work", "Personal", "Research"):');
    if (customCategory && customCategory.trim()) {
      const trimmedCategory = customCategory.trim();
      
      // Add to manual overrides
      this.manualOverrides.set(domain, trimmedCategory);
      
      // Save to site classifier for persistence (need full URL)
      if (url) {
        this.siteClassifier.learnFromUserAction(url, trimmedCategory);
      }
      
      // Add option to select
      const option = document.createElement('option');
      option.value = trimmedCategory;
      option.textContent = trimmedCategory;
      option.selected = true;
      
      // Insert before the "Create New" option
      const createNewOption = selectElement.querySelector('option[value="__custom__"]');
      selectElement.insertBefore(option, createNewOption);
    }
  }
  
  hidePreviewActions() {
    document.getElementById('previewActions').classList.remove('show');
  }
  
  async acceptPreview() {
    if (!this.previewedCategories) {
      this.showStatus('No preview available. Please run preview first.', 'error');
      return;
    }

    this.hidePreviewActions();
    this.hideAnalysisDetails();
    await this.organizeWithPreviewedCategories();
    
    // Clean up state after organizing
    this.analysisResults = [];
    this.previewedCategories = null;
    this.manualOverrides = new Map();
    this.duplicateTrackingMap = null;
  }
  
  declinePreview() {
    this.hidePreviewActions();
    this.hideAnalysisDetails();
    this.showStatus('Preview cancelled.', 'success');
    
    // Clean up state
    this.analysisResults = [];
    this.previewedCategories = null;
    this.manualOverrides = new Map();
    this.duplicateTrackingMap = null;
  }
  
  hideAnalysisDetails() {
    const detailsDiv = document.getElementById('analysisDetails');
    if (detailsDiv) {
      detailsDiv.style.display = 'none';
    }
  }
  
  async organizeWithPreviewedCategories() {
    if (!this.previewedCategories) {
      this.showStatus('No preview data available', 'error');
      return;
    }

    if (!this.selectedTargetFolderId) {
      this.showStatus('Please select a target folder', 'error');
      return;
    }

    try {
      this.showStatus('Organizing bookmarks with reviewed categories...', 'loading');
      
      const options = {
        removeDuplicates: document.getElementById('removeDuplicates').checked,
        removeEmptyFolders: document.getElementById('removeEmptyFolders').checked,
        moveBookmarks: document.getElementById('moveBookmarks').checked,
        createDateFolders: false
      };
      
      // Track source folders for cleanup
      const sourceFoldersToCheck = new Set(this.selectedFolders);

      // Process bookmarks with manual overrides applied
      const processedCount = await this.processBookmarksWithOverrides(
        this.previewedCategories.bookmarks, 
        this.selectedTargetFolderId, 
        options
      );

      // Remove duplicate instances from original locations if option is enabled
      if (options.removeDuplicates && options.moveBookmarks && this.duplicateTrackingMap) {
        await this.removeDuplicateInstances(this.duplicateTrackingMap);
      }

      // Clean up empty source folders if option is enabled
      if (options.removeEmptyFolders && sourceFoldersToCheck.size > 0) {
        // Remove target folder from cleanup since it will contain organized categories
        sourceFoldersToCheck.delete(this.selectedTargetFolderId);
        
        if (sourceFoldersToCheck.size > 0) {
          await this.cleanupEmptySourceFolders(sourceFoldersToCheck);
        }
      }

      this.showStatus(`Successfully ${options.moveBookmarks ? 'moved' : 'copied'} ${processedCount} bookmarks with custom categories!`, 'success');
      
      // Refresh folder tree
      await this.loadFolders();
      
    } catch (error) {
      this.showStatus('Error organizing bookmarks: ' + error.message, 'error');
    }
  }

  async processBookmarksWithOverrides(bookmarks, targetFolderId, options) {
    // Duplicate removal is now handled at higher level
    const categorizedBookmarks = this.categorizeBookmarks(bookmarks, options);
    
    let processedCount = 0;
    
    for (const [category, categoryBookmarks] of Object.entries(categorizedBookmarks)) {
      const categoryFolderId = await this.createOrGetCategoryFolder(targetFolderId, category);
      
      for (const bookmark of categoryBookmarks) {
        try {
          if (options.moveBookmarks) {
            // Move bookmark to new location
            await browser.bookmarks.move(bookmark.id, { parentId: categoryFolderId });
          } else {
            // Copy bookmark to new location (create duplicate)
            await browser.bookmarks.create({
              parentId: categoryFolderId,
              title: bookmark.title,
              url: bookmark.url
            });
          }
          processedCount++;
        } catch (error) {
          console.warn(`Failed to ${options.moveBookmarks ? 'move' : 'copy'} bookmark ${bookmark.title}:`, error);
        }
      }
    }
    
    return processedCount;
  }

  async saveOrganizationState() {
    try {
      await browser.storage.local.set({
        lastOrganize: new Date().toISOString(),
        organizedFolders: Array.from(this.selectedFolders),
        targetFolder: this.selectedTargetFolderId
      });
    } catch (error) {
      console.warn('Could not save organization state:', error);
    }
  }

  async cleanupEmptySourceFolders(sourceFolderIds) {
    try {
      this.showStatus('Checking for empty source folders...', 'loading');
      
      // Wait a moment for all bookmark moves to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload bookmark tree to get current state after moving bookmarks
      const updatedTree = await browser.bookmarks.getTree();
      this.bookmarkTree = updatedTree[0];
      
      const emptyFolders = [];
      
      // Check each source folder and ALL its subfolders recursively
      for (const folderId of sourceFolderIds) {
        const folder = this.findFolderById(this.bookmarkTree, folderId);
        if (folder) {
          // Check the folder itself and all its descendants
          this.findAllEmptyFoldersInSubtree(folder, emptyFolders, 0);
        }
      }
      
      if (emptyFolders.length > 0) {
        this.showStatus(`Removing ${emptyFolders.length} empty source folders...`, 'loading');
        
        // Sort folders by depth (deepest first) to avoid deletion conflicts
        emptyFolders.sort((a, b) => b.depth - a.depth);
        
        let deletedCount = 0;
        for (const folder of emptyFolders) {
          try {
            await browser.bookmarks.remove(folder.id);
            deletedCount++;
          } catch (error) {
            // Folder might already be deleted if it was a subfolder of another deleted folder
            console.warn(`Could not delete empty folder ${folder.title}:`, error);
          }
        }
        
        if (deletedCount > 0) {
          this.showStatus(`Successfully organized bookmarks and removed ${deletedCount} empty folders!`, 'success');
        }
      }
      
    } catch (error) {
      console.warn('Error during empty folder cleanup:', error);
    }
  }
  
  findAllEmptyFoldersInSubtree(node, emptyFolders, depth = 0) {
    if (node.type === 'folder' && node.id !== '0' && node.id !== '1' && node.id !== '2') {
      // First, recursively check all children to find empty subfolders
      if (node.children) {
        node.children.forEach(child => {
          if (child.type === 'folder') {
            this.findAllEmptyFoldersInSubtree(child, emptyFolders, depth + 1);
          }
        });
      }
      
      // Then check if this folder itself is empty using a simple check
      const isEmpty = this.isFolderCompletelyEmpty(node);
      
      if (isEmpty) {
        emptyFolders.push({
          id: node.id,
          title: node.title,
          depth: depth
        });
      }
    }
  }
  
  isFolderCompletelyEmpty(node) {
    // No children at all = empty
    if (!node.children || node.children.length === 0) {
      return true;
    }
    
    // Has any bookmarks = not empty
    const hasBookmarks = node.children.some(child => child.type === 'bookmark');
    if (hasBookmarks) {
      return false;
    }
    
    // Only has folders - check if ALL of them are empty
    const folderChildren = node.children.filter(child => child.type === 'folder');
    if (folderChildren.length === 0) {
      return true; // No folders and no bookmarks = empty
    }
    
    // Check if all folder children are empty (recursive check)
    return folderChildren.every(folder => this.isFolderCompletelyEmpty(folder));
  }

  async exportSettings() {
    try {
      // Get all user customizations
      const userCategories = await this.siteClassifier.exportUserData();
      const settings = await browser.storage.local.get();
      
      const exportData = {
        version: '2.0',
        exportDate: new Date().toISOString(),
        userCategories: userCategories,
        settings: settings,
        customRules: Array.from(this.manualOverrides.entries())
      };
      
      // Create download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookmark-organizer-settings-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      this.showStatus('Settings exported successfully!', 'success');
    } catch (error) {
      this.showStatus('Error exporting settings: ' + error.message, 'error');
    }
  }

  async importSettings() {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
          const text = await file.text();
          const importData = JSON.parse(text);
          
          // Validate import data
          if (!importData.version || !importData.userCategories) {
            throw new Error('Invalid import file format');
          }
          
          // Import user categories
          await this.siteClassifier.importUserData(importData.userCategories);
          
          // Import settings
          if (importData.settings) {
            await browser.storage.local.set(importData.settings);
          }
          
          // Import custom rules
          if (importData.customRules) {
            this.manualOverrides = new Map(importData.customRules);
          }
          
          this.showStatus('Settings imported successfully! Reloading...', 'success');
          
          // Reload after a short delay
          setTimeout(() => {
            window.location.reload();
          }, 1500);
          
        } catch (error) {
          this.showStatus('Error importing settings: ' + error.message, 'error');
        }
      };
      
      input.click();
    } catch (error) {
      this.showStatus('Error importing settings: ' + error.message, 'error');
    }
  }

  // Batch operations for better performance
  async processBookmarksInBatches(bookmarks, targetFolderId, options, batchSize = 50) {
    const batches = [];
    for (let i = 0; i < bookmarks.length; i += batchSize) {
      batches.push(bookmarks.slice(i, i + batchSize));
    }
    
    let totalProcessed = 0;
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const processed = await this.processBookmarks(batch, targetFolderId, options);
      totalProcessed += processed;
      
      // Update progress
      const progress = Math.round(((i + 1) / batches.length) * 100);
      this.showStatus(`Processing bookmarks: ${progress}% complete (${totalProcessed} bookmarks)`, 'success');
    }
    
    return totalProcessed;
  }

  // Clean up invalid bookmarks
  async cleanupInvalidBookmarks() {
    const allBookmarks = await this.getAllBookmarks();
    const invalid = allBookmarks.filter(b => !b.url || b.url.startsWith('javascript:'));
    
    if (invalid.length === 0) {
      this.showStatus('No invalid bookmarks found!', 'success');
      return;
    }
    
    if (confirm(`Found ${invalid.length} invalid bookmarks. Remove them?`)) {
      let removed = 0;
      for (const bookmark of invalid) {
        try {
          await browser.bookmarks.remove(bookmark.id);
          removed++;
        } catch (error) {
          console.warn('Could not remove bookmark:', error);
        }
      }
      this.showStatus(`Removed ${removed} invalid bookmarks!`, 'success');
      await this.loadFolders();
    }
  }

  async getAllBookmarks() {
    const bookmarks = [];
    const processNode = (node) => {
      if (node.type === 'bookmark') {
        bookmarks.push(node);
      } else if (node.children) {
        node.children.forEach(processNode);
      }
    };
    processNode(this.bookmarkTree);
    return bookmarks;
  }

  // Backup all bookmarks to JSON
  async backupBookmarks() {
    try {
      this.showStatus('Creating bookmark backup...', 'info');
      
      const bookmarkTree = await browser.bookmarks.getTree();
      const backupData = {
        version: '2.0',
        backupDate: new Date().toISOString(),
        bookmarkCount: this.countTotalBookmarks(bookmarkTree[0]),
        bookmarks: bookmarkTree[0]
      };
      
      // Create download
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookmark-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      this.showStatus(`Backup created successfully! (${backupData.bookmarkCount} bookmarks)`, 'success');
    } catch (error) {
      this.showStatus('Error creating backup: ' + error.message, 'error');
    }
  }

  // Restore bookmarks from JSON backup
  async restoreBookmarks() {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
          const text = await file.text();
          const backupData = JSON.parse(text);
          
          // Validate backup data
          if (!backupData.version || !backupData.bookmarks) {
            throw new Error('Invalid backup file format');
          }
          
          const confirmMsg = `This backup contains ${backupData.bookmarkCount || 'unknown'} bookmarks from ${new Date(backupData.backupDate).toLocaleDateString()}.\n\nRestore to "Restored Bookmarks" folder?`;
          
          if (!confirm(confirmMsg)) return;
          
          this.showStatus('Restoring bookmarks...', 'info');
          
          // Create restore folder
          const restoreFolder = await browser.bookmarks.create({
            parentId: '1', // Bookmarks bar
            title: `Restored Bookmarks ${new Date().toLocaleDateString()}`
          });
          
          // Restore bookmarks recursively
          let restoredCount = 0;
          const restoreNode = async (node, parentId) => {
            if (node.children) {
              for (const child of node.children) {
                if (child.type === 'folder' && child.title) {
                  const newFolder = await browser.bookmarks.create({
                    parentId: parentId,
                    title: child.title
                  });
                  await restoreNode(child, newFolder.id);
                } else if (child.type === 'bookmark' && child.url) {
                  await browser.bookmarks.create({
                    parentId: parentId,
                    title: child.title || 'Untitled',
                    url: child.url
                  });
                  restoredCount++;
                }
              }
            }
          };
          
          await restoreNode(backupData.bookmarks, restoreFolder.id);
          
          this.showStatus(`Successfully restored ${restoredCount} bookmarks!`, 'success');
          await this.loadFolders(); // Refresh the UI
          
        } catch (error) {
          this.showStatus('Error restoring bookmarks: ' + error.message, 'error');
        }
      };
      
      input.click();
    } catch (error) {
      this.showStatus('Error restoring bookmarks: ' + error.message, 'error');
    }
  }

  // Find empty folders with preview
  async findEmptyFolders() {
    if (this.isProcessing) {
      return;
    }
    
    this.isProcessing = true;
    const findButton = document.getElementById('findEmptyFoldersBtn');
    
    try {
      if (findButton) {
        findButton.disabled = true;
        findButton.textContent = '🔍 Searching for empty folders...';
      }
      
      // Ensure we have the latest bookmark tree
      if (!this.bookmarkTree) {
        this.showStatus('Loading bookmark data...', 'loading');
        await this.loadFolders();
      }
      
      if (!this.bookmarkTree) {
        throw new Error('Could not load bookmark tree');
      }
      
      const emptyFolders = [];
      
      // Find folders without bookmarks or content
      const checkFolder = (node, path = '') => {
        if (node.type === 'folder' && node.id !== '0' && node.id !== '1' && node.id !== '2') {
          const currentPath = path ? `${path} > ${node.title}` : node.title;
          
          // Check if folder has any direct bookmark children or non-empty subfolders
          const hasBookmarks = node.children && node.children.some(child => child.type === 'bookmark');
          const hasNonEmptySubfolders = node.children && node.children.some(child => 
            child.type === 'folder' && this.folderHasContent(child)
          );
          
          if (!hasBookmarks && !hasNonEmptySubfolders) {
            emptyFolders.push({
              id: node.id,
              title: node.title,
              path: currentPath,
              node: node
            });
          }
        }
        
        // Recursively check children
        if (node.children) {
          const currentPath = node.type === 'folder' && node.id !== '0' 
            ? (path ? `${path} > ${node.title}` : node.title) 
            : path;
          node.children.forEach(child => checkFolder(child, currentPath));
        }
      };
      
      checkFolder(this.bookmarkTree);
      
      if (emptyFolders.length === 0) {
        this.showNoEmptyFoldersFound();
      } else {
        this.emptyFolders = emptyFolders;
        this.selectedEmptyFolders = new Set(emptyFolders.map(f => f.id)); // Select all by default
        this.displayEmptyFolders();
      }
      
    } catch (error) {
      this.showStatus('Error finding empty folders: ' + error.message, 'error');
    } finally {
      if (findButton) {
        findButton.disabled = false;
        findButton.textContent = '🔍 Find Empty Folders';
      }
      this.isProcessing = false;
    }
  }

  // Display empty folders with preview and selection
  displayEmptyFolders() {
    const resultsDiv = document.getElementById('emptyFoldersResults');
    const summaryDiv = document.getElementById('emptyFoldersSummary');
    const containerDiv = document.getElementById('emptyFoldersContainer');
    
    if (!resultsDiv || !summaryDiv || !containerDiv) return;
    
    // Show summary
    summaryDiv.innerHTML = `
      <div class="empty-folders-instructions">
        📢 <strong>Preview:</strong> Review the empty folders below. Check the boxes next to folders you want to <strong>DELETE</strong>. 
        Unchecked folders will be kept. All folders are selected by default.
      </div>
      Found ${this.emptyFolders.length} empty folders ready for deletion.
    `;
    
    // Generate HTML for empty folders
    let html = '';
    
    this.emptyFolders.forEach((folder, index) => {
      const isSelected = this.selectedEmptyFolders.has(folder.id);
      
      html += `
        <div class="empty-folder-item ${isSelected ? 'selected' : ''}" data-folder-id="${folder.id}">
          <input type="checkbox" 
                 id="empty-folder-${folder.id}" 
                 value="${folder.id}" 
                 class="empty-folder-checkbox"
                 ${isSelected ? 'checked' : ''}
                 title="Check this folder to DELETE it">
          <div class="empty-folder-info">
            <div class="empty-folder-name">📁 ${this.escapeHtml(folder.title)}</div>
            <div class="empty-folder-path">${this.escapeHtml(folder.path)}</div>
          </div>
        </div>
      `;
    });
    
    containerDiv.innerHTML = `<div class="empty-folder-group">${html}</div>`;
    
    // Setup event listeners
    this.setupEmptyFolderListeners();
    
    // Show results
    resultsDiv.classList.add('show');
    
    // Scroll to empty folders results
    this.scrollToElement('emptyFoldersResults');
  }

  // Setup event listeners for empty folder checkboxes
  setupEmptyFolderListeners() {
    const checkboxes = document.querySelectorAll('.empty-folder-checkbox');
    
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const folderId = e.target.value;
        
        if (e.target.checked) {
          this.selectedEmptyFolders.add(folderId);
        } else {
          this.selectedEmptyFolders.delete(folderId);
        }
        
        this.updateEmptyFolderSelection(folderId);
      });
    });
  }

  // Update visual selection for empty folders
  updateEmptyFolderSelection(folderId) {
    const folderItem = document.querySelector(`.empty-folder-item[data-folder-id="${folderId}"]`);
    
    if (folderItem) {
      if (this.selectedEmptyFolders.has(folderId)) {
        folderItem.classList.add('selected');
      } else {
        folderItem.classList.remove('selected');
      }
    }
  }

  // Remove selected empty folders
  async removeEmptyFolders() {
    if (!this.emptyFolders || this.selectedEmptyFolders.size === 0) {
      this.showStatus('No empty folders selected for deletion.', 'error');
      return;
    }
    
    const removeButton = document.getElementById('removeEmptyFoldersBtn');
    
    try {
      removeButton.disabled = true;
      removeButton.textContent = '🗑️ Deleting empty folders...';
      
      const selectedFolders = this.emptyFolders.filter(f => this.selectedEmptyFolders.has(f.id));
      
      // Final confirmation with preview
      const folderList = selectedFolders.slice(0, 10).map(f => `• ${f.path}`).join('\n');
      const moreText = selectedFolders.length > 10 ? `\n...and ${selectedFolders.length - 10} more folders` : '';
      
      const confirmMessage = `You are about to delete ${selectedFolders.length} empty folders:\n\n${folderList}${moreText}\n\nThis action cannot be undone. Continue?`;
      
      if (!confirm(confirmMessage)) {
        this.showStatus('Deletion cancelled by user.', 'info');
        return;
      }
      
      let deletedCount = 0;
      
      // Delete in reverse order to handle nested folders properly
      const sortedFolders = selectedFolders.sort((a, b) => b.path.split(' > ').length - a.path.split(' > ').length);
      
      for (const folder of sortedFolders) {
        try {
          await browser.bookmarks.remove(folder.id);
          deletedCount++;
        } catch (error) {
          console.warn(`Could not delete folder ${folder.title}:`, error);
        }
      }
      
      this.showStatus(`Successfully deleted ${deletedCount} empty folders!`, 'success');
      
      // Scroll to results
      this.scrollToElement('status');
      
      // Hide empty folders results
      this.hideEmptyFoldersResults();
      
      // Refresh the bookmark tree
      await this.loadFolders();
      
    } catch (error) {
      this.showStatus('Error deleting empty folders: ' + error.message, 'error');
    } finally {
      removeButton.disabled = false;
      removeButton.textContent = '🗑️ Delete Selected Empty Folders';
    }
  }

  // Show when no empty folders are found
  showNoEmptyFoldersFound() {
    const resultsDiv = document.getElementById('emptyFoldersResults');
    const summaryDiv = document.getElementById('emptyFoldersSummary');
    const containerDiv = document.getElementById('emptyFoldersContainer');
    const actionsDiv = document.getElementById('emptyFoldersActions');
    
    if (!resultsDiv || !summaryDiv || !containerDiv) return;
    
    summaryDiv.innerHTML = `
      <div style="text-align: center; padding: 20px; background-color: #f0f8f0; border-radius: 8px; color: #2e7d32;">
        <div style="font-size: 24px; margin-bottom: 10px;">✅</div>
        <div style="font-weight: bold; font-size: 16px;">No empty folders found!</div>
        <div>Your bookmark organization is already clean.</div>
      </div>
    `;
    containerDiv.innerHTML = '';
    actionsDiv.style.display = 'none';
    
    resultsDiv.classList.add('show');
    
    // Scroll to empty folders results
    this.scrollToElement('emptyFoldersResults');
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
      this.hideEmptyFoldersResults();
    }, 4000);
  }

  // Hide empty folders results
  hideEmptyFoldersResults() {
    const resultsDiv = document.getElementById('emptyFoldersResults');
    const actionsDiv = document.getElementById('emptyFoldersActions');
    
    if (resultsDiv) {
      resultsDiv.classList.remove('show');
    }
    
    if (actionsDiv) {
      actionsDiv.style.display = 'flex';
    }
    
    // Clear data
    this.emptyFolders = [];
    this.selectedEmptyFolders = new Set();
  }

  // Helper to check if a folder has any content
  folderHasContent(node) {
    if (!node.children || node.children.length === 0) {
      return false;
    }
    
    // Check if any direct children are bookmarks
    const hasBookmarks = node.children.some(child => child.type === 'bookmark');
    if (hasBookmarks) {
      return true;
    }

    // Check if any subfolder has content
    const subfolders = node.children.filter(child => child.type === 'folder');
    return subfolders.some(subfolder => this.folderHasContent(subfolder));
  }

  async removeDuplicateInstances(uriLocationMap) {
    try {
      this.showStatus('Removing duplicate instances from original locations...', 'loading');
      
      let removedCount = 0;
      
      for (const [uri, instances] of uriLocationMap) {
        if (instances.length > 1) {
          // Remove all but the first instance (which was already organized)
          for (let i = 1; i < instances.length; i++) {
            try {
              await browser.bookmarks.remove(instances[i].id);
              removedCount++;
            } catch (error) {
              console.warn(`Failed to remove duplicate bookmark ${instances[i].title}:`, error);
            }
          }
        }
      }
      
      if (removedCount > 0) {
        this.showStatus(`Removed ${removedCount} duplicate instances from original locations`, 'loading');
      }
      
    } catch (error) {
      console.warn('Error removing duplicate instances:', error);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new BookmarkOrganizer();
});