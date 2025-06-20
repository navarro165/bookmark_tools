// Modern site classifier with keyword-based categorization (NO hardcoded sites)

class SiteClassifier {
  constructor() {
    this.categoryRules = this.buildCategoryRules();
    this.userCategories = new Map();
    this.loadUserData();
  }

  async loadUserData() {
    try {
      const result = await browser.storage.local.get(['userCategories']);
      if (result.userCategories) {
        this.userCategories = new Map(Object.entries(result.userCategories));
      }
    } catch (error) {
      console.warn('Could not load user data:', error);
    }
  }

  async saveUserData() {
    try {
      await browser.storage.local.set({
        userCategories: Object.fromEntries(this.userCategories)
      });
    } catch (error) {
      console.warn('Could not save user data:', error);
    }
  }

  buildCategoryRules() {
    return {
      'Development': {
        // Programming languages, frameworks, tools
        keywords: [
          // Programming Languages
          'programming', 'coding', 'code', 'developer', 'development', 'software',
          'javascript', 'typescript', 'python', 'java', 'ruby', 'php', 'golang', 
          'rust', 'swift', 'kotlin', 'scala', 'perl', 'cpp', 'csharp', 'dotnet',
          'objective-c', 'matlab', 'r-lang', 'julia', 'haskell', 'clojure',
          'elixir', 'erlang', 'lua', 'dart', 'groovy', 'fortran', 'cobol',
          'pascal', 'delphi', 'visual-basic', 'powershell', 'bash', 'shell',
          'assembly', 'webassembly', 'wasm', 'solidity', 'vyper', 'cairo',
          
          // Web Frameworks & Libraries
          'react', 'angular', 'vue', 'svelte', 'nextjs', 'nuxt', 'gatsby',
          'remix', 'astro', 'solid', 'preact', 'ember', 'backbone', 'jquery',
          'express', 'nestjs', 'fastify', 'koa', 'hapi', 'meteor', 'sails',
          'django', 'flask', 'fastapi', 'pyramid', 'bottle', 'tornado',
          'rails', 'sinatra', 'laravel', 'symfony', 'codeigniter', 'slim',
          'spring', 'springboot', 'struts', 'hibernate', 'mybatis',
          'gin', 'echo', 'fiber', 'beego', 'revel', 'actix', 'rocket',
          
          // Mobile Development
          'android', 'ios', 'react-native', 'flutter', 'xamarin', 'ionic',
          'cordova', 'phonegap', 'nativescript', 'expo', 'capacitor',
          'swiftui', 'uikit', 'jetpack', 'compose', 'kotlin-multiplatform',
          
          // Databases
          'database', 'sql', 'nosql', 'mysql', 'postgresql', 'postgres',
          'sqlite', 'mariadb', 'oracle', 'sqlserver', 'mssql', 'mongodb',
          'redis', 'elasticsearch', 'cassandra', 'couchdb', 'dynamodb',
          'firebase', 'firestore', 'supabase', 'prisma', 'sequelize',
          'typeorm', 'mongoose', 'knex', 'drizzle', 'mikro-orm',
          
          // Cloud & DevOps
          'aws', 'azure', 'gcp', 'google-cloud', 'digitalocean', 'linode',
          'heroku', 'netlify', 'vercel', 'cloudflare', 'docker', 'kubernetes',
          'k8s', 'helm', 'terraform', 'ansible', 'puppet', 'chef', 'vagrant',
          'jenkins', 'gitlab-ci', 'github-actions', 'circleci', 'travis',
          'bamboo', 'teamcity', 'bitbucket-pipelines', 'drone', 'argo',
          
          // Tools & IDEs
          'vscode', 'visual-studio', 'intellij', 'webstorm', 'pycharm',
          'phpstorm', 'rubymine', 'goland', 'rider', 'datagrip', 'eclipse',
          'netbeans', 'atom', 'sublime', 'vim', 'neovim', 'emacs', 'nano',
          'git', 'github', 'gitlab', 'bitbucket', 'sourcetree', 'gitkraken',
          'npm', 'yarn', 'pnpm', 'pip', 'composer', 'bundler', 'cargo',
          'maven', 'gradle', 'webpack', 'vite', 'rollup', 'parcel', 'esbuild',
          'babel', 'eslint', 'prettier', 'jest', 'mocha', 'cypress', 'playwright',
          
          // Data Science & ML
          'tensorflow', 'pytorch', 'scikit-learn', 'keras', 'pandas', 'numpy',
          'scipy', 'matplotlib', 'seaborn', 'plotly', 'jupyter', 'anaconda',
          'spacy', 'nltk', 'opencv', 'yolo', 'transformers', 'huggingface',
          'mlflow', 'kubeflow', 'airflow', 'dagster', 'prefect', 'dbt',
          
          // Game Development
          'unity', 'unreal', 'godot', 'gamemaker', 'construct', 'phaser',
          'threejs', 'babylonjs', 'cocos', 'defold', 'love2d', 'pygame',
          'opengl', 'directx', 'vulkan', 'webgl', 'webgpu', 'shader',
          
          // Concepts & Patterns
          'api', 'rest', 'graphql', 'grpc', 'websocket', 'webhook', 'oauth',
          'jwt', 'microservice', 'serverless', 'lambda', 'function', 'class',
          'object', 'method', 'variable', 'constant', 'interface', 'abstract',
          'inheritance', 'polymorphism', 'encapsulation', 'solid', 'dry',
          'kiss', 'yagni', 'design-pattern', 'singleton', 'factory', 'observer',
          'mvc', 'mvvm', 'mvp', 'repository', 'dependency-injection',
          
          // Version Control & Collaboration
          'version-control', 'branch', 'merge', 'commit', 'pull-request',
          'merge-request', 'fork', 'clone', 'push', 'pull', 'rebase', 'cherry-pick',
          'tag', 'release', 'changelog', 'issue', 'bug', 'feature', 'hotfix',
          'workflow', 'agile', 'scrum', 'kanban', 'sprint', 'standup',
          
          // Testing & Quality
          'testing', 'test', 'unit-test', 'integration-test', 'e2e', 'tdd',
          'bdd', 'coverage', 'mock', 'stub', 'fixture', 'assertion', 'suite',
          'selenium', 'puppeteer', 'testcafe', 'karma', 'jasmine', 'qunit',
          'phpunit', 'pytest', 'rspec', 'minitest', 'junit', 'testng',
          
          // Documentation & Learning
          'documentation', 'docs', 'readme', 'tutorial', 'guide', 'reference',
          'manual', 'example', 'sample', 'snippet', 'gist', 'cookbook',
          'cheatsheet', 'roadmap', 'changelog', 'contributing', 'license',
          'stack-overflow', 'mdn', 'w3schools', 'dev-to', 'medium-tech',
          
          // Build & Package Management
          'build', 'compile', 'transpile', 'bundle', 'minify', 'uglify',
          'optimize', 'tree-shaking', 'code-splitting', 'lazy-loading',
          'hot-reload', 'hmr', 'sourcemap', 'polyfill', 'shim', 'ponyfill',
          'package', 'module', 'library', 'framework', 'sdk', 'cli', 'plugin',
          'extension', 'addon', 'middleware', 'boilerplate', 'template',
          'scaffold', 'generator', 'yeoman', 'create-react-app', 'vue-cli',
          
          // Security
          'security', 'authentication', 'authorization', 'encryption',
          'hashing', 'salt', 'bcrypt', 'argon2', 'ssl', 'tls', 'https',
          'cors', 'csrf', 'xss', 'sql-injection', 'sanitize', 'validate',
          'firewall', 'penetration-testing', 'vulnerability', 'exploit',
          
          // Performance
          'performance', 'optimization', 'profiling', 'benchmark', 'metrics',
          'monitoring', 'logging', 'debugging', 'breakpoint', 'debugger',
          'console', 'inspector', 'devtools', 'lighthouse', 'pagespeed',
          
          // Architecture
          'architecture', 'monolith', 'distributed', 'scalable', 'resilient',
          'fault-tolerant', 'load-balancer', 'reverse-proxy', 'cdn', 'cache',
          'queue', 'message-broker', 'event-driven', 'pub-sub', 'rabbitmq',
          'kafka', 'redis-queue', 'celery', 'sidekiq', 'bull', 'sqs',
          
          // Blockchain & Web3
          'blockchain', 'ethereum', 'bitcoin', 'smart-contract', 'dapp',
          'web3', 'defi', 'nft', 'dao', 'metamask', 'truffle', 'hardhat',
          'ganache', 'remix-ide', 'ethers', 'web3js', 'openzeppelin',
          
          // Other Technical Terms
          'localhost', 'staging', 'production', 'environment', 'config',
          'deployment', 'continuous-integration', 'continuous-deployment',
          'ci-cd', 'pipeline', 'artifact', 'registry', 'repository-pattern',
          'namespace', 'scope', 'closure', 'callback', 'promise', 'async',
          'await', 'observable', 'stream', 'buffer', 'binary', 'hex',
          'base64', 'json', 'xml', 'yaml', 'toml', 'ini', 'env',
          'regex', 'expression', 'pattern', 'algorithm', 'data-structure',
          'array', 'list', 'stack', 'queue', 'tree', 'graph', 'hash',
          'sort', 'search', 'complexity', 'big-o', 'recursion', 'iteration'
        ],
        weight: 1.0
      },
      
      'News': {
        keywords: [
          // News terms (English)
          'news', 'breaking', 'latest', 'update', 'headline', 'article',
          'report', 'coverage', 'story', 'press', 'media', 'journalist',
          'editor', 'reporter', 'newspaper', 'magazine', 'publication',
          'broadcast', 'live', 'bulletin', 'brief', 'digest', 'summary',
          // International news terms
          'noticias', 'noticia', 'prensa', 'actualidad', 'informacion',
          // Topics
          'politics', 'political', 'election', 'government', 'policy',
          'economy', 'economic', 'finance', 'market', 'business',
          'world', 'international', 'national', 'local', 'regional',
          'sports', 'weather', 'climate', 'health', 'science', 'technology',
          'entertainment', 'culture', 'society', 'opinion', 'editorial',
          'analysis', 'investigation', 'exclusive', 'interview', 'feature',
          // Time references
          'today', 'yesterday', 'tomorrow', 'daily', 'weekly', 'monthly',
          'current', 'recent', 'ongoing', 'developing', 'happened', 'occurred'
        ],
        weight: 1.0
      },

      'Shopping': {
        keywords: [
          // Commerce terms
          'shop', 'shopping', 'store', 'buy', 'purchase', 'order', 'sell',
          'sale', 'deal', 'discount', 'coupon', 'promo', 'offer', 'price',
          'cost', 'payment', 'checkout', 'cart', 'basket', 'wishlist',
          'product', 'item', 'merchandise', 'goods', 'inventory', 'stock',
          // Categories
          'clothing', 'fashion', 'apparel', 'shoes', 'accessories',
          'electronics', 'gadget', 'appliance', 'furniture', 'home',
          'beauty', 'cosmetic', 'health', 'wellness', 'fitness',
          'book', 'music', 'movie', 'game', 'toy', 'hobby', 'craft',
          'food', 'grocery', 'gourmet', 'organic', 'delivery',
          // Actions
          'browse', 'search', 'filter', 'sort', 'compare', 'review',
          'rating', 'feedback', 'return', 'refund', 'exchange',
          'shipping', 'tracking', 'express', 'free', 'guarantee',
          'warranty', 'customer', 'service', 'support', 'retail',
          'wholesale', 'marketplace', 'vendor', 'merchant', 'seller'
        ],
        weight: 1.0
      },

      'Social': {
        keywords: [
          // Social actions
          'social', 'network', 'connect', 'share', 'post', 'comment',
          'like', 'love', 'react', 'follow', 'unfollow', 'friend',
          'message', 'chat', 'conversation', 'discuss', 'forum',
          'community', 'group', 'page', 'profile', 'timeline', 'feed',
          'status', 'update', 'story', 'reel', 'video', 'photo',
          // Engagement
          'tag', 'mention', 'hashtag', 'trending', 'viral', 'popular',
          'notification', 'alert', 'invite', 'event', 'meetup',
          'live', 'stream', 'broadcast', 'audience', 'follower',
          'subscriber', 'member', 'user', 'account', 'settings',
          'privacy', 'public', 'private', 'block', 'report',
          // Communication
          'messenger', 'direct', 'instant', 'voice', 'video', 'call',
          'conference', 'meeting', 'webinar', 'collaborate'
        ],
        weight: 1.0
      },

      'Entertainment': {
        keywords: [
          // Media types
          'entertainment', 'movie', 'film', 'cinema', 'theater', 'show',
          'series', 'episode', 'season', 'tv', 'television', 'channel',
          'music', 'song', 'album', 'artist', 'band', 'concert', 'playlist',
          'video', 'clip', 'trailer', 'preview', 'review', 'rating',
          // Gaming
          'game', 'gaming', 'play', 'player', 'level', 'score', 'achievement',
          'multiplayer', 'online', 'console', 'pc', 'mobile', 'app',
          'stream', 'streamer', 'esports', 'tournament', 'competition',
          // Actions
          'watch', 'listen', 'stream', 'download', 'subscribe', 'rental',
          'ticket', 'booking', 'showtime', 'schedule', 'release',
          'premiere', 'debut', 'launch', 'live', 'performance',
          // Content
          'comedy', 'drama', 'action', 'horror', 'romance', 'documentary',
          'animation', 'anime', 'cartoon', 'podcast', 'radio', 'broadcast'
        ],
        weight: 1.0
      },

      'Education': {
        keywords: [
          // Academic
          'education', 'educational', 'learn', 'learning', 'study', 'studying',
          'teach', 'teaching', 'academic', 'university', 'college', 'school',
          'institute', 'academy', 'campus', 'faculty', 'department',
          // Courses
          'course', 'class', 'lesson', 'lecture', 'seminar', 'workshop',
          'tutorial', 'training', 'certification', 'degree', 'diploma',
          'bachelor', 'master', 'phd', 'doctorate', 'program', 'curriculum',
          // Activities
          'student', 'teacher', 'professor', 'instructor', 'educator',
          'assignment', 'homework', 'project', 'exam', 'test', 'quiz',
          'grade', 'score', 'transcript', 'enrollment', 'admission',
          'scholarship', 'tuition', 'fee', 'registration', 'semester',
          // Resources
          'textbook', 'material', 'resource', 'library', 'research',
          'paper', 'thesis', 'dissertation', 'journal', 'publication',
          'knowledge', 'skill', 'online', 'distance', 'remote', 'mooc'
        ],
        weight: 1.0
      },

      'Reference': {
        keywords: [
          // Information sources
          'reference', 'information', 'info', 'data', 'fact', 'knowledge',
          'encyclopedia', 'wiki', 'dictionary', 'glossary', 'definition',
          'guide', 'manual', 'handbook', 'resource', 'database', 'archive',
          'library', 'collection', 'repository', 'directory', 'index',
          // Research
          'research', 'study', 'paper', 'publication', 'journal', 'article',
          'document', 'report', 'analysis', 'statistics', 'survey',
          'finding', 'result', 'conclusion', 'abstract', 'citation',
          // Lookup
          'search', 'find', 'lookup', 'query', 'browse', 'explore',
          'discover', 'learn', 'understand', 'explain', 'definition',
          'meaning', 'terminology', 'concept', 'theory', 'principle'
        ],
        weight: 1.0
      },

      'Productivity': {
        keywords: [
          // Tools
          'productivity', 'task', 'todo', 'list', 'organize', 'manage',
          'schedule', 'calendar', 'planner', 'agenda', 'appointment',
          'meeting', 'event', 'reminder', 'notification', 'deadline',
          // Work
          'work', 'workplace', 'office', 'business', 'professional',
          'project', 'team', 'collaborate', 'collaboration', 'workflow',
          'process', 'efficiency', 'performance', 'goal', 'objective',
          // Communication
          'email', 'mail', 'inbox', 'compose', 'send', 'receive',
          'message', 'communication', 'contact', 'address', 'phone',
          // Storage
          'file', 'document', 'folder', 'drive', 'cloud', 'storage',
          'backup', 'sync', 'share', 'upload', 'download', 'save',
          // Apps
          'note', 'memo', 'journal', 'diary', 'track', 'monitor',
          'report', 'dashboard', 'analytics', 'metric', 'chart'
        ],
        weight: 1.0
      }
    };
  }

  classifySite(url, title = '', description = '') {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '').toLowerCase();
      
      // Check user preferences first
      if (this.userCategories.has(domain)) {
        return {
          category: this.userCategories.get(domain),
          confidence: 1.0 // User preferences have highest confidence
        };
      }
      
      // Combine all available text for analysis
      const fullText = `${domain} ${urlObj.pathname} ${title} ${description}`.toLowerCase();
      
      // Score each category
      const categoryScores = {};
      let maxScore = 0;
      let bestCategory = 'Other';
      
      for (const [categoryName, categoryData] of Object.entries(this.categoryRules)) {
        let score = 0;
        let matchedKeywords = [];
        
        // Count keyword matches (all comparisons are already lowercase)
        for (const keyword of categoryData.keywords) {
          if (fullText.includes(keyword)) {
            const keywordScore = keyword.length > 5 ? 2 : 1; // Longer keywords get higher weight
            score += keywordScore;
            matchedKeywords.push(keyword);
          }
        }
        
        // Apply category weight
        score *= categoryData.weight;
        
        // Store the score with matched keywords
        categoryScores[categoryName] = { score, matchedKeywords };
        
        // Track the best category
        if (score > maxScore) {
          maxScore = score;
          bestCategory = categoryName;
        }
      }
      
      // Calculate confidence based on the winning score
      let confidence = 0.3; // Base confidence for no matches
      
      if (maxScore > 0) {
        const winningData = categoryScores[bestCategory];
        
        // Confidence based on number of matched keywords and score
        if (winningData.matchedKeywords.length >= 5) {
          confidence = 0.9;
        } else if (winningData.matchedKeywords.length >= 3) {
          confidence = 0.8;
        } else if (winningData.matchedKeywords.length >= 2) {
          confidence = 0.7;
        } else if (winningData.matchedKeywords.length === 1) {
          confidence = 0.5;
        }
        
        // Adjust confidence if multiple categories have similar scores
        const scores = Object.values(categoryScores).map(s => s.score).sort((a, b) => b - a);
        if (scores.length > 1 && scores[0] > 0 && scores[1] > 0) {
          const ratio = scores[1] / scores[0];
          if (ratio > 0.8) {
            confidence *= 0.8; // Reduce confidence if categories are too similar
          }
        }
      }
      
      // Special handling for common TLDs
      if (maxScore === 0) {
        if (domain.endsWith('.edu')) {
          bestCategory = 'Education';
          confidence = 0.7;
        } else if (domain.endsWith('.gov')) {
          bestCategory = 'Reference';
          confidence = 0.7;
        } else if (domain.endsWith('.org')) {
          bestCategory = 'Reference';
          confidence = 0.5;
        }
      }
      
      return {
        category: bestCategory,
        confidence: Math.min(confidence, 0.95) // Cap at 0.95 for non-user preferences
      };
      
    } catch (error) {
      console.error('Classification error:', error);
      return {
        category: 'Other',
        confidence: 0.1
      };
    }
  }

  // Enhanced classification using existing bookmark data
  async classifyWithPageFetch(url, title = '', description = '') {
    // Use existing bookmark title and URL for classification - no external fetching needed
    // The bookmark title usually contains the actual page title when it was saved
    return this.classifySite(url, title, description);
  }

  getFallbackCategory(domain) {
    // Only use TLD-based categorization, no hardcoded domains
    if (domain.endsWith('.gov')) return 'Reference';
    if (domain.endsWith('.edu')) return 'Education';
    if (domain.endsWith('.org')) return 'Reference';
    
    return 'Other';
  }

  // Learn from user actions
  async learnFromUserAction(url, category) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '').toLowerCase();
      
      this.userCategories.set(domain, category);
      await this.saveUserData();
      
    } catch (error) {
      console.error('Error learning from user action:', error);
    }
  }

  // Get suggested categories for manual override
  getSuggestedCategories() {
    const builtInCategories = Object.keys(this.categoryRules).concat(['Other']);
    const customCategories = Array.from(new Set(Array.from(this.userCategories.values())));
    
    // Combine and remove duplicates, keeping built-in categories first
    const allCategories = [...builtInCategories];
    customCategories.forEach(category => {
      if (!allCategories.includes(category)) {
        allCategories.push(category);
      }
    });
    
    return allCategories.sort();
  }

  // Export user customizations
  async exportUserData() {
    return {
      userCategories: Object.fromEntries(this.userCategories)
    };
  }

  // Import user customizations
  async importUserData(data) {
    if (data.userCategories) {
      this.userCategories = new Map(Object.entries(data.userCategories));
    }
    await this.saveUserData();
  }
}