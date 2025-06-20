// Mock browser API for testing
window.mockBookmarks = [
  {
    id: '0',
    type: 'folder',
    title: '',
    children: [
      {
        id: '1',
        type: 'folder',
        title: 'Bookmarks Bar',
        children: [
          {
            id: '10',
            type: 'folder',
            title: 'Development',
            children: [
              {
                id: '100',
                type: 'bookmark',
                title: 'GitHub - Where software is built',
                url: 'https://github.com',
                dateAdded: Date.now() - 86400000
              },
              {
                id: '101',
                type: 'bookmark',
                title: 'Stack Overflow',
                url: 'https://stackoverflow.com',
                dateAdded: Date.now() - 172800000
              },
              {
                id: '102',
                type: 'bookmark',
                title: 'MDN Web Docs',
                url: 'https://developer.mozilla.org',
                dateAdded: Date.now() - 259200000
              }
            ]
          },
          {
            id: '11',
            type: 'folder',
            title: 'News',
            children: [
              {
                id: '110',
                type: 'bookmark',
                title: 'TechCrunch – Startup and Technology News',
                url: 'https://techcrunch.com',
                dateAdded: Date.now() - 345600000
              },
              {
                id: '111',
                type: 'bookmark',
                title: 'BBC News',
                url: 'https://www.bbc.com/news',
                dateAdded: Date.now() - 432000000
              }
            ]
          },
          {
            id: '12',
            type: 'folder',
            title: 'Empty Folder',
            children: []
          },
          {
            id: '13',
            type: 'bookmark',
            title: 'Duplicate GitHub',
            url: 'https://github.com',
            dateAdded: Date.now() - 518400000
          }
        ]
      },
      {
        id: '2',
        type: 'folder',
        title: 'Other Bookmarks',
        children: [
          {
            id: '20',
            type: 'bookmark',
            title: 'Unknown Site',
            url: 'https://example-unknown-site.com/blog/post',
            dateAdded: Date.now() - 604800000
          },
          {
            id: '21',
            type: 'bookmark',
            title: 'Shopping Site',
            url: 'https://shop.example.com/products/item123',
            dateAdded: Date.now() - 691200000
          }
        ]
      }
    ]
  }
];

window.mockStorage = {
  local: {
    data: {},
    get: function(keys) {
      return new Promise((resolve) => {
        if (Array.isArray(keys)) {
          const result = {};
          keys.forEach(key => {
            if (this.data[key] !== undefined) {
              result[key] = this.data[key];
            }
          });
          resolve(result);
        } else if (typeof keys === 'string') {
          resolve({ [keys]: this.data[keys] });
        } else if (typeof keys === 'object' && !Array.isArray(keys)) {
          const result = {};
          Object.keys(keys).forEach(key => {
            result[key] = this.data[key] !== undefined ? this.data[key] : keys[key];
          });
          resolve(result);
        } else {
          resolve(this.data);
        }
      });
    },
    set: function(items) {
      return new Promise((resolve) => {
        Object.assign(this.data, items);
        resolve();
      });
    },
    clear: function() {
      return new Promise((resolve) => {
        this.data = {};
        resolve();
      });
    }
  }
};

// Mock browser object
window.browser = {
  bookmarks: {
    getTree: function() {
      return Promise.resolve(JSON.parse(JSON.stringify(window.mockBookmarks)));
    },
    getSubTree: function(id) {
      const findNode = (node, targetId) => {
        if (node.id === targetId) return node;
        if (node.children) {
          for (const child of node.children) {
            const found = findNode(child, targetId);
            if (found) return found;
          }
        }
        return null;
      };
      
      const node = findNode(window.mockBookmarks[0], id);
      return Promise.resolve(node ? [JSON.parse(JSON.stringify(node))] : []);
    },
    getChildren: function(id) {
      const findNode = (node, targetId) => {
        if (node.id === targetId) return node;
        if (node.children) {
          for (const child of node.children) {
            const found = findNode(child, targetId);
            if (found) return found;
          }
        }
        return null;
      };
      
      const node = findNode(window.mockBookmarks[0], id);
      return Promise.resolve(node && node.children ? JSON.parse(JSON.stringify(node.children)) : []);
    },
    create: function(bookmark) {
      return Promise.resolve({
        id: 'new-' + Date.now(),
        ...bookmark
      });
    },
    move: function(id, destination) {
      return Promise.resolve({ id, parentId: destination.parentId });
    },
    remove: function(id) {
      return Promise.resolve();
    }
  },
  
  storage: window.mockStorage,
  
  tabs: {
    create: function(options) {
      return Promise.resolve({ id: 1, url: options.url });
    }
  },
  
  runtime: {
    onInstalled: {
      addListener: function() {}
    },
    onMessage: {
      addListener: function() {}
    },
    getURL: function(path) {
      return 'chrome-extension://mock-extension-id/' + path;
    }
  },
  
  browserAction: {
    onClicked: {
      addListener: function() {}
    }
  }
};

// Also set chrome for compatibility
window.chrome = window.browser;

// Add browser-specific test utilities
window.mockBrowserEnvironment = {
  // Simulate Firefox environment
  setFirefox: function() {
    window.browser = this.createBrowserAPI();
    window.chrome = window.browser; // Firefox also provides chrome for compatibility
    window.browser._isFirefox = true;
    window.chrome._isFirefox = true;
  },
  
  // Simulate Chrome environment
  setChrome: function() {
    delete window.browser; // Chrome doesn't have 'browser' global
    window.chrome = this.createBrowserAPI();
    window.chrome._isChrome = true;
  },
  
  // Simulate Firefox with no Chrome compatibility
  setFirefoxOnly: function() {
    window.browser = this.createBrowserAPI();
    delete window.chrome;
    window.browser._isFirefoxOnly = true;
  },
  
  // Reset to default (both available)
  reset: function() {
    window.browser = this.createBrowserAPI();
    window.chrome = window.browser;
  },
  
  // Create browser API object
  createBrowserAPI: function() {
    return {
      bookmarks: {
        getTree: function() {
          return Promise.resolve(JSON.parse(JSON.stringify(window.mockBookmarks)));
        },
        getSubTree: function(id) {
          const findNode = (node, targetId) => {
            if (node.id === targetId) return node;
            if (node.children) {
              for (const child of node.children) {
                const found = findNode(child, targetId);
                if (found) return found;
              }
            }
            return null;
          };
          
          const node = findNode(window.mockBookmarks[0], id);
          return Promise.resolve(node ? [JSON.parse(JSON.stringify(node))] : []);
        },
        getChildren: function(id) {
          const findNode = (node, targetId) => {
            if (node.id === targetId) return node;
            if (node.children) {
              for (const child of node.children) {
                const found = findNode(child, targetId);
                if (found) return found;
              }
            }
            return null;
          };
          
          const node = findNode(window.mockBookmarks[0], id);
          return Promise.resolve(node && node.children ? JSON.parse(JSON.stringify(node.children)) : []);
        },
        create: function(bookmark) {
          return Promise.resolve({
            id: 'new-' + Date.now(),
            ...bookmark
          });
        },
        move: function(id, destination) {
          return Promise.resolve({ id, parentId: destination.parentId });
        },
        remove: function(id) {
          return Promise.resolve();
        }
      },
      
      storage: {
        local: {
          data: {},
          QUOTA_BYTES: 5242880, // Chrome's 5MB limit
          get: function(keys) {
            return new Promise((resolve) => {
              if (Array.isArray(keys)) {
                const result = {};
                keys.forEach(key => {
                  if (this.data[key] !== undefined) {
                    result[key] = this.data[key];
                  }
                });
                resolve(result);
              } else if (typeof keys === 'string') {
                resolve({ [keys]: this.data[keys] });
              } else if (typeof keys === 'object' && !Array.isArray(keys)) {
                const result = {};
                Object.keys(keys).forEach(key => {
                  result[key] = this.data[key] !== undefined ? this.data[key] : keys[key];
                });
                resolve(result);
              } else {
                resolve(this.data);
              }
            });
          },
          set: function(items) {
            return new Promise((resolve) => {
              Object.assign(this.data, items);
              resolve();
            });
          },
          clear: function() {
            return new Promise((resolve) => {
              this.data = {};
              resolve();
            });
          },
          remove: function(keys) {
            return new Promise((resolve) => {
              if (Array.isArray(keys)) {
                keys.forEach(key => delete this.data[key]);
              } else {
                delete this.data[keys];
              }
              resolve();
            });
          }
        }
      },
      
      tabs: {
        create: function(options) {
          return Promise.resolve({ id: 1, url: options.url });
        }
      },
      
      runtime: {
        onInstalled: {
          addListener: function() {},
          removeListener: function() {}
        },
        onMessage: {
          addListener: function() {},
          removeListener: function() {}
        },
        getURL: function(path) {
          return 'chrome-extension://mock-extension-id/' + path;
        }
      },
      
      browserAction: {
        onClicked: {
          addListener: function() {},
          removeListener: function() {}
        }
      },
      
      // Chrome Manifest V3 uses 'action' instead of 'browserAction'
      action: {
        onClicked: {
          addListener: function() {},
          removeListener: function() {}
        }
      }
    };
  }
}; 