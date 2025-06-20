// Modern Test Runner for Bookmark Tools (Current Implementation)
class NewTestRunner {
  constructor() {
    this.testSuites = [
      SiteClassifierNewTests,
      BookmarkSearchNewTests,
      ContentAnalyzerNewTests,
      DuplicateDetectorNewTests,
      BackgroundNewTests
    ];
    
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };
    
    this.currentSuite = null;
    this.isRunning = false;
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    document.getElementById('runAllNewTests')?.addEventListener('click', () => {
      this.runAllTests();
    });
    
    document.getElementById('runClassifierTests')?.addEventListener('click', () => {
      this.runSpecificSuite('SiteClassifier (New Implementation) Tests');
    });
    
    document.getElementById('runSearchTests')?.addEventListener('click', () => {
      this.runSpecificSuite('BookmarkSearch (New Implementation) Tests');
    });
    
    document.getElementById('runAnalyzerTests')?.addEventListener('click', () => {
      this.runSpecificSuite('ContentAnalyzer (New Implementation) Tests');
    });
    
    document.getElementById('runDetectorTests')?.addEventListener('click', () => {
      this.runSpecificSuite('DuplicateDetector (New Implementation) Tests');
    });
    
    document.getElementById('runBackgroundTests')?.addEventListener('click', () => {
      this.runSpecificSuite('Background Script (New Implementation) Tests');
    });
    
    document.getElementById('clearNewResults')?.addEventListener('click', () => {
      this.clearResults();
    });
    
    document.getElementById('stopTests')?.addEventListener('click', () => {
      this.stopTests();
    });
  }
  
  async runAllTests() {
    if (this.isRunning) {
      console.warn('Tests are already running');
      return;
    }
    
    this.isRunning = true;
    this.clearResults();
    console.log('🚀 Running all new implementation tests...');
    
    const startTime = performance.now();
    
    try {
      for (const suite of this.testSuites) {
        if (!this.isRunning) break; // Allow stopping
        
        await this.runTestSuite(suite);
      }
      
      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      this.showSummary(duration);
    } catch (error) {
      this.handleTestRunnerError(error);
    } finally {
      this.isRunning = false;
    }
  }
  
  async runSpecificSuite(suiteName) {
    if (this.isRunning) {
      console.warn('Tests are already running');
      return;
    }
    
    const suite = this.testSuites.find(s => s.name === suiteName);
    if (!suite) {
      console.error(`Test suite "${suiteName}" not found`);
      return;
    }
    
    this.isRunning = true;
    this.clearResults();
    console.log(`🎯 Running ${suiteName}...`);
    
    const startTime = performance.now();
    
    try {
      await this.runTestSuite(suite);
      
      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      this.showSummary(duration);
    } catch (error) {
      this.handleTestRunnerError(error);
    } finally {
      this.isRunning = false;
    }
  }
  
  async runTestSuite(suite) {
    const resultsContainer = document.getElementById('newTestResults');
    
    this.currentSuite = suite.name;
    
    const suiteDiv = document.createElement('div');
    suiteDiv.className = 'test-section';
    suiteDiv.innerHTML = `
      <h3>${suite.name}</h3>
      <div class="suite-progress">Running tests...</div>
    `;
    resultsContainer.appendChild(suiteDiv);
    
    const progressDiv = suiteDiv.querySelector('.suite-progress');
    let completed = 0;
    const total = suite.tests.length;
    
    for (const test of suite.tests) {
      if (!this.isRunning) break;
      
      progressDiv.textContent = `Running test ${completed + 1} of ${total}: ${test.name}`;
      
      const testResult = await this.runTest(test, suite.name);
      const resultDiv = this.createTestResultElement(test.name, testResult);
      suiteDiv.appendChild(resultDiv);
      
      completed++;
      
      // Small delay to allow UI updates and interruption
      await this.delay(1);
    }
    
    progressDiv.textContent = `Completed ${completed} of ${total} tests`;
    
    if (completed < total) {
      progressDiv.textContent += ` (${total - completed} skipped due to stop)`;
    }
  }
  
  async runTest(test, suiteName) {
    const startTime = performance.now();
    
    try {
      // Prepare clean environment for each test
      this.prepareTestEnvironment();
      
      await test.test();
      const duration = performance.now() - startTime;
      
      this.results.passed++;
      return {
        passed: true,
        duration: duration.toFixed(2),
        suite: suiteName
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.results.failed++;
      this.results.errors.push({
        testName: test.name,
        suiteName: suiteName,
        error: error.message,
        stack: error.stack
      });
      
      return {
        passed: false,
        error: error.message,
        stack: error.stack,
        duration: duration.toFixed(2),
        suite: suiteName
      };
    }
  }
  
  prepareTestEnvironment() {
    // Reset browser mocks to clean state
    if (window.mockBrowserEnvironment) {
      window.mockBrowserEnvironment.reset();
    }
    
    // Clear any DOM elements that tests might have created
    const existingResults = document.querySelectorAll('.test-created-element');
    existingResults.forEach(el => el.remove());
  }
  
  createTestResultElement(testName, result) {
    const div = document.createElement('div');
    div.className = `test-result ${result.passed ? 'pass' : 'fail'}`;
    
    const icon = result.passed ? '✅' : '❌';
    const status = result.passed ? 'PASS' : 'FAIL';
    
    div.innerHTML = `
      <div class="test-result-header">
        <strong>${icon} ${testName}</strong>
        <span class="test-duration">${result.duration}ms</span>
      </div>
    `;
    
    if (!result.passed) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-details';
      
      // Show just the error message, full stack in console
      errorDiv.innerHTML = `
        <div class="error-message">${this.escapeHtml(result.error)}</div>
        <div class="error-actions">
          <button onclick="console.error('${result.suite} - ${testName}', '${this.escapeHtml(result.error)}', '${this.escapeHtml(result.stack || '')}')">
            📄 Log Full Error to Console
          </button>
        </div>
      `;
      div.appendChild(errorDiv);
      
      // Also log to console for debugging
      console.error(`❌ ${result.suite} - ${testName}:`, result.error);
      if (result.stack) {
        console.error('Stack trace:', result.stack);
      }
    }
    
    return div;
  }
  
  showSummary(duration) {
    const summaryDiv = document.getElementById('newTestSummary');
    const total = this.results.passed + this.results.failed + this.results.skipped;
    const percentage = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : 0;
    
    let summaryIcon = '📊';
    let summaryColor = '#333';
    
    if (this.results.failed === 0 && this.results.skipped === 0) {
      summaryIcon = '🎉';
      summaryColor = '#28a745';
    } else if (this.results.failed > this.results.passed) {
      summaryIcon = '😞';
      summaryColor = '#dc3545';
    } else if (this.results.failed > 0) {
      summaryIcon = '⚠️';
      summaryColor = '#ffc107';
    }
    
    summaryDiv.innerHTML = `
      <div style="color: ${summaryColor};">
        ${summaryIcon} Test Results (${duration}s): 
        <span style="color: #28a745; font-weight: bold;">${this.results.passed} passed</span>, 
        <span style="color: #dc3545; font-weight: bold;">${this.results.failed} failed</span>
        ${this.results.skipped > 0 ? `, <span style="color: #6c757d;">${this.results.skipped} skipped</span>` : ''}
        (${percentage}% success rate)
      </div>
    `;
    
    summaryDiv.style.display = 'block';
    
    // Show additional details if there are failures
    if (this.results.failed > 0) {
      this.showFailureDetails();
    }
    
    // Scroll to summary
    summaryDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  
  showFailureDetails() {
    const outputDiv = document.getElementById('newTestOutput');
    
    const failuresByCategory = {};
    this.results.errors.forEach(error => {
      if (!failuresByCategory[error.suiteName]) {
        failuresByCategory[error.suiteName] = [];
      }
      failuresByCategory[error.suiteName].push(error);
    });
    
    let output = '🔍 Failed Tests Summary:\n\n';
    
    Object.keys(failuresByCategory).forEach(suiteName => {
      output += `📁 ${suiteName}:\n`;
      failuresByCategory[suiteName].forEach(error => {
        output += `   ❌ ${error.testName}\n`;
        output += `      Error: ${error.error}\n\n`;
      });
    });
    
    outputDiv.textContent = output;
    outputDiv.style.display = 'block';
  }
  
  stopTests() {
    if (this.isRunning) {
      this.isRunning = false;
      console.log('🛑 Stopping test execution...');
      
      const summaryDiv = document.getElementById('newTestSummary');
      summaryDiv.innerHTML = `
        <div style="color: #ffc107;">
          ⏹️ Tests stopped by user. Partial results shown above.
        </div>
      `;
      summaryDiv.style.display = 'block';
    }
  }
  
  clearResults() {
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };
    
    this.currentSuite = null;
    
    document.getElementById('newTestResults').innerHTML = '';
    document.getElementById('newTestSummary').style.display = 'none';
    document.getElementById('newTestOutput').style.display = 'none';
  }
  
  handleTestRunnerError(error) {
    console.error('Test runner error:', error);
    
    const summaryDiv = document.getElementById('newTestSummary');
    summaryDiv.innerHTML = `
      <div style="color: #dc3545;">
        💥 Test runner encountered an error: ${this.escapeHtml(error.message)}
      </div>
    `;
    summaryDiv.style.display = 'block';
  }
  
  escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Utility method to get test statistics
  getTestStatistics() {
    const total = this.testSuites.reduce((sum, suite) => sum + suite.tests.length, 0);
    const suiteStats = this.testSuites.map(suite => ({
      name: suite.name,
      testCount: suite.tests.length
    }));
    
    return {
      totalSuites: this.testSuites.length,
      totalTests: total,
      suiteBreakdown: suiteStats,
      averageTestsPerSuite: (total / this.testSuites.length).toFixed(1)
    };
  }
}

// Initialize test runner when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize if we're on the new test page
  if (document.getElementById('newTestResults')) {
    window.newTestRunner = new NewTestRunner();
    
    const stats = window.newTestRunner.getTestStatistics();
    console.log('🧪 New Test Runner initialized');
    console.log(`📊 Test Statistics:`, stats);
    console.log('🎯 Click "Run All New Tests" to begin comprehensive testing');
    
    // Show test statistics in UI
    const statsDiv = document.getElementById('testStats');
    if (statsDiv) {
      statsDiv.innerHTML = `
        <h4>📊 Test Suite Statistics</h4>
        <ul>
          <li><strong>Total Test Suites:</strong> ${stats.totalSuites}</li>
          <li><strong>Total Tests:</strong> ${stats.totalTests}</li>
          <li><strong>Average Tests per Suite:</strong> ${stats.averageTestsPerSuite}</li>
        </ul>
        <details>
          <summary>📁 Suite Breakdown</summary>
          <ul>
            ${stats.suiteBreakdown.map(suite => 
              `<li><strong>${suite.name}:</strong> ${suite.testCount} tests</li>`
            ).join('')}
          </ul>
        </details>
      `;
    }
  }
}); 