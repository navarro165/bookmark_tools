// Simple test validation script
const fs = require('fs');
const path = require('path');

console.log('🧪 Validating Bookmark Tools Test Suite\n');

const testFiles = [
  'mock-browser-api.js',
  'test-site-classifier.js',
  'test-content-analyzer.js',
  'test-bookmark-search.js',
  'test-duplicate-detector.js',
  'test-browser-compatibility.js',
  'test-cross-browser-code.js',
  'test-integration.js',
  'test-runner.js',
  'test-runner.html'
];

let allValid = true;

// Check if all test files exist
console.log('📁 Checking test files:');
testFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`  ✅ ${file} (${(stats.size / 1024).toFixed(1)}KB)`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    allValid = false;
  }
});

// Count total tests
const testSuites = [
  { file: 'test-site-classifier.js', name: 'SiteClassifierTests' },
  { file: 'test-content-analyzer.js', name: 'ContentAnalyzerTests' },
  { file: 'test-bookmark-search.js', name: 'BookmarkSearchTests' },
  { file: 'test-duplicate-detector.js', name: 'DuplicateDetectorTests' },
  { file: 'test-browser-compatibility.js', name: 'BrowserCompatibilityTests' },
  { file: 'test-cross-browser-code.js', name: 'CrossBrowserCodeTests' },
  { file: 'test-integration.js', name: 'IntegrationTests' }
];

console.log('\n📊 Test Suite Summary:');
let totalTests = 0;

testSuites.forEach(suite => {
  try {
    const content = fs.readFileSync(path.join(__dirname, suite.file), 'utf8');
    const testMatches = content.match(/name:\s*['"`]([^'"`]+)['"`]/g);
    const testCount = testMatches ? testMatches.length - 1 : 0; // -1 for suite name
    console.log(`  ${suite.name}: ${testCount} tests`);
    totalTests += testCount;
  } catch (error) {
    console.log(`  ${suite.name}: Error reading file`);
  }
});

console.log(`\n🎯 Total Tests: ${totalTests}`);

// Validate test structure
console.log('\n🔍 Validating test structure:');
const requiredPatterns = [
  { pattern: /async test\(\)/, description: 'Async test functions', required: true },
  { pattern: /throw new Error/, description: 'Error assertions', required: true },
  { pattern: /mockOrganizer|mockBookmarks|new SiteClassifier|new ContentAnalyzer|window\.browser|window\.chrome/, description: 'Test setup', required: true }
];

let structureValid = true;
testSuites.forEach(suite => {
  try {
    const content = fs.readFileSync(path.join(__dirname, suite.file), 'utf8');
    requiredPatterns.forEach(({ pattern, description, required }) => {
      if (required && !pattern.test(content)) {
        console.log(`  ⚠️  ${suite.file} might be missing: ${description}`);
        structureValid = false;
      }
    });
  } catch (error) {
    // Skip
  }
});

if (structureValid) {
  console.log('  ✅ All test files have proper structure');
}

// Final result
console.log('\n' + '='.repeat(50));
if (allValid && structureValid) {
  console.log('✅ Test suite validation PASSED!');
  console.log('\nTo run tests:');
  console.log('1. Open test/test-runner.html in your browser');
  console.log('2. Click "Run All Tests"');
} else {
  console.log('❌ Test suite validation FAILED!');
  console.log('Please fix the issues above before running tests.');
}
console.log('='.repeat(50));

process.exit(allValid && structureValid ? 0 : 1); 