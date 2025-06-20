// Tests for Empty Folder Detection and Management
const EmptyFolderTests = {
  name: 'Empty Folder Detection Tests',
  
  tests: [
    {
      name: 'Should find empty folders correctly',
      async test() {
        const mockOrganizer = {
          bookmarkTree: window.mockBookmarks[0],
          isProcessing: false,
          showStatus: () => {},
          escapeHtml: (text) => text,
          emptyFolders: [],
          selectedEmptyFolders: new Set(),
          folderHasContent: function(node) {
            if (!node.children || node.children.length === 0) return false;
            return node.children.some(child => 
              child.type === 'bookmark' || 
              (child.type === 'folder' && this.folderHasContent(child))
            );
          },
          findEmptyFolders: async function() {
            const emptyFolders = [];
            
            const checkFolder = (node, path = '') => {
              if (node.type === 'folder' && node.id !== '0') {
                const currentPath = path ? `${path} > ${node.title}` : node.title;
                
                const hasContent = node.children && node.children.some(child => 
                  child.type === 'bookmark' || 
                  (child.type === 'folder' && this.folderHasContent(child))
                );
                
                if (!hasContent) {
                  emptyFolders.push({
                    id: node.id,
                    title: node.title,
                    path: currentPath,
                    node: node
                  });
                }
              }
              
              if (node.children) {
                const currentPath = path ? `${path} > ${node.title}` : node.title;
                node.children.forEach(child => checkFolder(child, currentPath));
              }
            };
            
            checkFolder(this.bookmarkTree);
            this.emptyFolders = emptyFolders;
            return emptyFolders;
          }
        };
        
        const emptyFolders = await mockOrganizer.findEmptyFolders();
        
        if (emptyFolders.length === 0) {
          throw new Error('Should find empty folders in mock data');
        }
        
        // Should find the "Empty Folder" from mock data
        const emptyFolder = emptyFolders.find(f => f.title === 'Empty Folder');
        if (!emptyFolder) {
          throw new Error('Should find "Empty Folder" in mock data');
        }
        
        // Should have correct path
        if (!emptyFolder.path.includes('Bookmarks Bar > Empty Folder')) {
          throw new Error('Empty folder path not constructed correctly');
        }
      }
    },
    
    {
      name: 'Should not classify folders with bookmarks as empty',
      async test() {
        const mockOrganizer = {
          bookmarkTree: window.mockBookmarks[0],
          isProcessing: false,
          showStatus: () => {},
          escapeHtml: (text) => text,
          emptyFolders: [],
          selectedEmptyFolders: new Set(),
          folderHasContent: function(node) {
            if (!node.children || node.children.length === 0) return false;
            return node.children.some(child => 
              child.type === 'bookmark' || 
              (child.type === 'folder' && this.folderHasContent(child))
            );
          },
          findEmptyFolders: async function() {
            const emptyFolders = [];
            
            const checkFolder = (node, path = '') => {
              if (node.type === 'folder' && node.id !== '0') {
                const currentPath = path ? `${path} > ${node.title}` : node.title;
                
                const hasContent = node.children && node.children.some(child => 
                  child.type === 'bookmark' || 
                  (child.type === 'folder' && this.folderHasContent(child))
                );
                
                if (!hasContent) {
                  emptyFolders.push({
                    id: node.id,
                    title: node.title,
                    path: currentPath,
                    node: node
                  });
                }
              }
              
              if (node.children) {
                const currentPath = path ? `${path} > ${node.title}` : node.title;
                node.children.forEach(child => checkFolder(child, currentPath));
              }
            };
            
            checkFolder(this.bookmarkTree);
            this.emptyFolders = emptyFolders;
            return emptyFolders;
          }
        };
        
        const emptyFolders = await mockOrganizer.findEmptyFolders();
        
        // Development folder has bookmarks, should not be empty
        const devFolder = emptyFolders.find(f => f.title === 'Development');
        if (devFolder) {
          throw new Error('Development folder should not be classified as empty');
        }
        
        // News folder has bookmarks, should not be empty
        const newsFolder = emptyFolders.find(f => f.title === 'News');
        if (newsFolder) {
          throw new Error('News folder should not be classified as empty');
        }
      }
    },
    
    {
      name: 'Should handle nested empty folders',
      async test() {
        const mockTree = {
          id: '0',
          type: 'folder',
          title: '',
          children: [
            {
              id: '1',
              type: 'folder',
              title: 'Parent',
              children: [
                {
                  id: '2',
                  type: 'folder',
                  title: 'EmptyChild1',
                  children: []
                },
                {
                  id: '3',
                  type: 'folder',
                  title: 'EmptyChild2',
                  children: []
                }
              ]
            }
          ]
        };
        
        const mockOrganizer = {
          bookmarkTree: mockTree,
          isProcessing: false,
          showStatus: () => {},
          escapeHtml: (text) => text,
          emptyFolders: [],
          selectedEmptyFolders: new Set(),
          folderHasContent: function(node) {
            if (!node.children || node.children.length === 0) return false;
            return node.children.some(child => 
              child.type === 'bookmark' || 
              (child.type === 'folder' && this.folderHasContent(child))
            );
          },
          findEmptyFolders: async function() {
            const emptyFolders = [];
            
            const checkFolder = (node, path = '') => {
              if (node.type === 'folder' && node.id !== '0') {
                const currentPath = path ? `${path} > ${node.title}` : node.title;
                
                const hasContent = node.children && node.children.some(child => 
                  child.type === 'bookmark' || 
                  (child.type === 'folder' && this.folderHasContent(child))
                );
                
                if (!hasContent) {
                  emptyFolders.push({
                    id: node.id,
                    title: node.title,
                    path: currentPath,
                    node: node
                  });
                }
              }
              
              if (node.children) {
                const currentPath = path ? `${path} > ${node.title}` : node.title;
                node.children.forEach(child => checkFolder(child, currentPath));
              }
            };
            
            checkFolder(this.bookmarkTree);
            this.emptyFolders = emptyFolders;
            return emptyFolders;
          }
        };
        
        const emptyFolders = await mockOrganizer.findEmptyFolders();
        
        // Should find all 3 empty folders (Parent and both children)
        if (emptyFolders.length !== 3) {
          throw new Error(`Expected 3 empty folders, found ${emptyFolders.length}`);
        }
        
        // Should include the parent folder (which only has empty children)
        const parentFolder = emptyFolders.find(f => f.title === 'Parent');
        if (!parentFolder) {
          throw new Error('Should classify parent folder as empty when it only contains empty folders');
        }
      }
    },
    
    {
      name: 'Should handle folder with mix of empty folders and bookmarks',
      async test() {
        const mockTree = {
          id: '0',
          type: 'folder',
          title: '',
          children: [
            {
              id: '1',
              type: 'folder',
              title: 'MixedParent',
              children: [
                {
                  id: '2',
                  type: 'folder',
                  title: 'EmptyChild',
                  children: []
                },
                {
                  id: '3',
                  type: 'bookmark',
                  title: 'Test Bookmark',
                  url: 'https://example.com'
                }
              ]
            }
          ]
        };
        
        const mockOrganizer = {
          bookmarkTree: mockTree,
          isProcessing: false,
          showStatus: () => {},
          escapeHtml: (text) => text,
          emptyFolders: [],
          selectedEmptyFolders: new Set(),
          folderHasContent: function(node) {
            if (!node.children || node.children.length === 0) return false;
            return node.children.some(child => 
              child.type === 'bookmark' || 
              (child.type === 'folder' && this.folderHasContent(child))
            );
          },
          findEmptyFolders: async function() {
            const emptyFolders = [];
            
            const checkFolder = (node, path = '') => {
              if (node.type === 'folder' && node.id !== '0') {
                const currentPath = path ? `${path} > ${node.title}` : node.title;
                
                const hasContent = node.children && node.children.some(child => 
                  child.type === 'bookmark' || 
                  (child.type === 'folder' && this.folderHasContent(child))
                );
                
                if (!hasContent) {
                  emptyFolders.push({
                    id: node.id,
                    title: node.title,
                    path: currentPath,
                    node: node
                  });
                }
              }
              
              if (node.children) {
                const currentPath = path ? `${path} > ${node.title}` : node.title;
                node.children.forEach(child => checkFolder(child, currentPath));
              }
            };
            
            checkFolder(this.bookmarkTree);
            this.emptyFolders = emptyFolders;
            return emptyFolders;
          }
        };
        
        const emptyFolders = await mockOrganizer.findEmptyFolders();
        
        // Should only find the empty child, not the parent (which has a bookmark)
        if (emptyFolders.length !== 1) {
          throw new Error(`Expected 1 empty folder, found ${emptyFolders.length}`);
        }
        
        const emptyChild = emptyFolders.find(f => f.title === 'EmptyChild');
        if (!emptyChild) {
          throw new Error('Should find EmptyChild folder');
        }
        
        const mixedParent = emptyFolders.find(f => f.title === 'MixedParent');
        if (mixedParent) {
          throw new Error('Should not classify MixedParent as empty (contains bookmark)');
        }
      }
    },
    
    {
      name: 'Should handle completely empty bookmark tree',
      async test() {
        const mockTree = {
          id: '0',
          type: 'folder',
          title: '',
          children: []
        };
        
        const mockOrganizer = {
          bookmarkTree: mockTree,
          isProcessing: false,
          showStatus: () => {},
          escapeHtml: (text) => text,
          emptyFolders: [],
          selectedEmptyFolders: new Set(),
          folderHasContent: function(node) {
            if (!node.children || node.children.length === 0) return false;
            return node.children.some(child => 
              child.type === 'bookmark' || 
              (child.type === 'folder' && this.folderHasContent(child))
            );
          },
          findEmptyFolders: async function() {
            const emptyFolders = [];
            
            const checkFolder = (node, path = '') => {
              if (node.type === 'folder' && node.id !== '0') {
                const currentPath = path ? `${path} > ${node.title}` : node.title;
                
                const hasContent = node.children && node.children.some(child => 
                  child.type === 'bookmark' || 
                  (child.type === 'folder' && this.folderHasContent(child))
                );
                
                if (!hasContent) {
                  emptyFolders.push({
                    id: node.id,
                    title: node.title,
                    path: currentPath,
                    node: node
                  });
                }
              }
              
              if (node.children) {
                const currentPath = path ? `${path} > ${node.title}` : node.title;
                node.children.forEach(child => checkFolder(child, currentPath));
              }
            };
            
            checkFolder(this.bookmarkTree);
            this.emptyFolders = emptyFolders;
            return emptyFolders;
          }
        };
        
        const emptyFolders = await mockOrganizer.findEmptyFolders();
        
        // Should find no empty folders in completely empty tree
        if (emptyFolders.length !== 0) {
          throw new Error('Should find no empty folders in completely empty tree');
        }
      }
    }
  ]
}; 