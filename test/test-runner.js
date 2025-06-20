// Test Runner for Bookmark Tools
class TestRunner {
  constructor() {
    this.testSuites = [
      ValidationTests,
      SiteClassifierTests,
      ContentAnalyzerTests,
      BookmarkSearchTests,
      DuplicateDetectorTests,
      EmptyFolderTests,
      BrowserCompatibilityTests,
      CrossBrowserCodeTests,
      IntegrationTests
    ];
    
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    document.getElementById('runAllTests').addEventListener('click', () => {
      this.runAllTests();
    });
    
    document.getElementById('runUnitTests').addEventListener('click', () => {
      this.runUnitTests();
    });
    
    document.getElementById('runIntegrationTests').addEventListener('click', () => {
      this.runIntegrationTests();
    });
    
    document.getElementById('clearResults').addEventListener('click', () => {
      this.clearResults();
    });
  }
  
  async runAllTests() {
    this.clearResults();
    console.log('Running all tests...');
    
    for (const suite of this.testSuites) {
      await this.runTestSuite(suite);
    }
    
    this.showSummary();
  }
  
  async runUnitTests() {
    this.clearResults();
    console.log('Running unit tests...');
    
    const unitSuites = this.testSuites.filter(suite => 
      suite.name !== 'Integration Tests'
    );
    
    for (const suite of unitSuites) {
      await this.runTestSuite(suite);
    }
    
    this.showSummary();
  }
  
  async runIntegrationTests() {
    this.clearResults();
    console.log('Running integration tests...');
    
    const integrationSuite = this.testSuites.find(suite => 
      suite.name === 'Integration Tests'
    );
    
    if (integrationSuite) {
      await this.runTestSuite(integrationSuite);
    }
    
    this.showSummary();
  }
  
  async runTestSuite(suite) {
    const resultsContainer = document.getElementById('testResults');
    
    const suiteDiv = document.createElement('div');
    suiteDiv.className = 'test-section';
    suiteDiv.innerHTML = `<h3>${suite.name}</h3>`;
    resultsContainer.appendChild(suiteDiv);
    
    for (const test of suite.tests) {
      const testResult = await this.runTest(test);
      const resultDiv = this.createTestResultElement(test.name, testResult);
      suiteDiv.appendChild(resultDiv);
    }
  }
  
  async runTest(test) {
    const startTime = performance.now();
    
    try {
      await test.test();
      const duration = performance.now() - startTime;
      
      this.results.passed++;
      return {
        passed: true,
        duration: duration.toFixed(2)
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.results.failed++;
      this.results.errors.push({
        testName: test.name,
        error: error.message,
        stack: error.stack
      });
      
      return {
        passed: false,
        error: error.message,
        stack: error.stack,
        duration: duration.toFixed(2)
      };
    }
  }
  
  createTestResultElement(testName, result) {
    const div = document.createElement('div');
    div.className = `test-result ${result.passed ? 'pass' : 'fail'}`;
    
    const icon = result.passed ? '✅' : '❌';
    const status = result.passed ? 'PASS' : 'FAIL';
    
    div.innerHTML = `
      <strong>${icon} ${testName}</strong>
      <span style="float: right; font-size: 12px;">${result.duration}ms</span>
    `;
    
    if (!result.passed) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-details';
      errorDiv.textContent = result.error;
      div.appendChild(errorDiv);
      
      // Log full stack trace to console
      console.error(`Test failed: ${testName}`, result.error, result.stack);
    }
    
    return div;
  }
  
  showSummary() {
    const summaryDiv = document.getElementById('testSummary');
    const total = this.results.passed + this.results.failed;
    const percentage = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : 0;
    
    let summaryClass = 'test-summary';
    let summaryIcon = '📊';
    
    if (this.results.failed === 0) {
      summaryIcon = '🎉';
    } else if (this.results.failed > this.results.passed) {
      summaryIcon = '😟';
    }
    
    summaryDiv.innerHTML = `
      ${summaryIcon} Test Results: 
      <span style="color: #28a745;">${this.results.passed} passed</span>, 
      <span style="color: #dc3545;">${this.results.failed} failed</span> 
      (${percentage}% success rate)
    `;
    
    summaryDiv.style.display = 'block';
    
    // Show detailed output if there are failures
    if (this.results.failed > 0) {
      const outputDiv = document.getElementById('test-output');
      outputDiv.textContent = 'Failed Tests:\n\n' + 
        this.results.errors.map(e => 
          `❌ ${e.testName}\n   Error: ${e.error}\n`
        ).join('\n');
      outputDiv.style.display = 'block';
    }
  }
  
  clearResults() {
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
    
    document.getElementById('testResults').innerHTML = '';
    document.getElementById('testSummary').style.display = 'none';
    document.getElementById('test-output').style.display = 'none';
  }
}

// Initialize test runner when page loads
document.addEventListener('DOMContentLoaded', () => {
  window.testRunner = new TestRunner();
  console.log('Test runner initialized. Click "Run All Tests" to begin.');
}); 