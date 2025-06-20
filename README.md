<div align="center">
  <img src="bookmark_tools.jpeg" alt="Bookmark Tools Logo" width="120" height="120">
  
  # Bookmark Tools
  
  **A modern Firefox extension for intelligent bookmark organization with keyword-based categorization and powerful management features.**
  
  ![Firefox](https://img.shields.io/badge/Firefox-109.0+-FF7139?style=flat&logo=firefox-browser&logoColor=white)
  ![Version](https://img.shields.io/badge/Version-3.1-blue?style=flat)
  ![License](https://img.shields.io/badge/License-MIT-green?style=flat)
</div>

## ✨ Features

### 🔍 **Quick Search**
- Real-time search through all bookmarks with relevance scoring
- Smart highlighting of matching terms in titles, URLs, and paths
- Keyboard navigation (arrow keys, Enter) with visual selection
- Instant results with domain matching and recency bonuses

### 🧹 **Duplicate Detection**
- Find exact URL duplicates across all bookmark folders
- Visual comparison with user-controlled selection (green = keep, red = delete)
- Preserves folder path information for better decision making
- Smart sorting by date added and title length

### 📂 **Empty Folder Cleanup**
- Detect completely empty bookmark folders throughout the tree
- Preview before deletion with selective checkboxes
- Recursive detection including nested empty folders
- Keeps your bookmark tree organized

### 🎯 **Smart Categorization**
- Keyword-based website classification (no hardcoded patterns)
- 8 clear categories: Development, News, Shopping, Social, Entertainment, Education, Reference, Productivity
- User preference learning with 100% confidence for manual overrides
- Custom category creation and persistence

### 💾 **Backup & Restore**
- Full bookmark backup to JSON with complete tree structure
- Settings export/import for user preferences
- Safe restoration with error handling
- Data integrity protection

## 🚀 Installation

### Firefox
1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" in the sidebar
3. Click "Load Temporary Add-on..."
4. Select the `manifest.json` file from this project
5. The extension opens in a dedicated tab - bookmark it for easy access!

### System Requirements
- **Firefox 109.0 or newer**
- **Permissions**: Bookmarks, Storage, Tabs
- **Memory**: Optimized with smart caching

## 🎯 How to Use

### Quick Search
1. Click the extension icon or open the bookmarked tab
2. Type in the search box (minimum 2 characters)
3. Click results to open in new tabs, or use arrow keys + Enter
4. Results are ranked by relevance with automatic highlighting

### Remove Duplicates
1. Click "🔍 Find Duplicate Bookmarks"
2. Review duplicate groups showing all exact URL matches
3. Check boxes next to bookmarks you want to KEEP (green)
4. Unchecked bookmarks will be deleted (red)
5. Click "🗑️ Delete All Red Items (Keep Green Ones)"

### Clean Empty Folders
1. Click "🔍 Find Empty Folders"
2. Review the list of completely empty folders
3. Uncheck any folders you want to preserve
4. Click "🗑️ Delete Selected Empty Folders"

### Smart Organization
1. **Select source folders** to organize (check boxes in left panel)
2. **Preview contents** by clicking any folder to see bookmarks inside
3. **Target folder** is automatically set (highlighted with green border)
4. Click "👁️ **Preview Categories**" to see automatic classification
5. **Review and adjust** categories in the preview panel
6. Click "✅ **Accept & Organize**" to apply changes

## 🔧 Categorization System

The extension uses intelligent keyword matching to automatically categorize bookmarks:

### Categories
- **Development**: Programming languages, frameworks, documentation, APIs, code repositories
- **News**: Current events, journalism, breaking news, tech updates
- **Shopping**: E-commerce, online stores, deals, product comparisons
- **Social**: Social media, forums, communities, messaging platforms
- **Entertainment**: Movies, music, gaming, streaming, videos
- **Education**: Courses, tutorials, academic resources, certification programs
- **Reference**: Wikis, government sites, organizational resources, guides
- **Productivity**: Email, cloud storage, project management, productivity tools

### How It Works
- **Keyword Analysis**: Analyzes URLs, titles, and descriptions for category keywords
- **Confidence Scoring**: Returns confidence levels based on keyword matches
- **User Learning**: Remembers your manual category assignments with highest priority
- **TLD Recognition**: Special handling for .edu, .gov, .org domains
- **Fallback System**: Graceful handling of unknown or ambiguous content

## 🧪 Testing

### Comprehensive Test Suite
The project includes a modern test suite with 73 tests covering all functionality:

1. **Run New Tests**: Open `test/test-runner-new.html` in Firefox
2. **Click "🚀 Run All New Tests"** for complete validation
3. **Individual Test Suites**: Run specific components (Site Classifier, Search, etc.)
4. **Real-time Results**: See detailed pass/fail results with performance timing

### Test Coverage
- **Site Classifier**: 15 tests covering keyword classification and user preferences
- **Bookmark Search**: 16 tests covering indexing, scoring, and navigation
- **Content Analyzer**: 20 tests covering analysis algorithms and caching
- **Duplicate Detector**: 14 tests covering exact matching and user selection
- **Background Script**: 8 tests covering installation and tab management

## 🔒 Privacy & Security

- **100% Local Processing**: All operations happen in your browser
- **No Network Requests**: Zero external data transmission
- **No Tracking**: No analytics, telemetry, or user tracking
- **Open Source**: Full code transparency
- **Firefox Native APIs**: Uses only browser-provided functionality

## 🛡️ Permissions

- **Bookmarks**: Read and modify bookmark data for organization features
- **Storage**: Save user preferences and classification learning
- **Tabs**: Open search results in new tabs

## 📋 Project Structure

```
bookmark-tools/
├── manifest.json              # Extension configuration
├── popup.html                # Main user interface
├── popup.js                  # Core application logic (2000+ lines)
├── background.js             # Background script with tab management
├── site-classifier.js        # Keyword-based categorization engine
├── content-analyzer.js       # Multi-source content analysis
├── bookmark-search.js        # Search with relevance scoring
├── duplicate-detector.js     # Exact URL duplicate detection
├── icons/                   # Extension icons
└── test/                    # Comprehensive test suite
    ├── test-runner-new.html # Modern test interface
    ├── test-*-new.js       # Test suites for current implementation
    └── mock-browser-api.js # Testing utilities
```

## 🎯 Key Features

### **Persistent Tab Experience**
- Opens in a dedicated browser tab that stays open
- No disappearing popups - full workspace experience
- Bookmark the extension tab for instant access

### **Intelligent Organization**
- Side-by-side folder tree and content preview
- Visual target folder highlighting with "🎯 TARGET" indicator
- Smart folder selection with automatic target assignment

### **Modern Interface**
- Real-time progress indicators and status updates
- Smooth auto-scrolling to results and important sections
- Always-visible scrollbars for large result sets
- Responsive design that works on different screen sizes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality using the modern test suite
4. Ensure all 73 tests pass
5. Submit a pull request

## 📈 Recent Updates

### v3.1 (Current)
- ✅ **Comprehensive test suite** with 73 tests covering all functionality
- 🏷️ **Simplified categories** - clean category names without subcategories
- 🎯 **Keyword-based classification** - intelligent pattern matching without hardcoded sites
- 💾 **Enhanced user learning** - manual category assignments remembered permanently
- 🔄 **Exact duplicate detection** - finds duplicates by exact URL matching
- ⚡ **Performance optimizations** - smart caching and batch processing

## 📄 License

MIT License - See LICENSE file for details

## 🆘 Support

If you encounter issues:

1. **Run the test suite** at `test/test-runner-new.html` to verify functionality
2. **Check the Browser Console** (`Ctrl+Shift+J`) for detailed error messages
3. **Verify permissions** are granted for bookmarks and storage
4. **Try reloading** the extension from `about:debugging`

---

**Organize your bookmarks with modern, intelligent tools! 🚀**