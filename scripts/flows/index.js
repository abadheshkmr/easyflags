#!/usr/bin/env node

/**
 * Flow Testing Suite
 * 
 * This script runs all the flow tests for the feature flag service.
 * It can be used to verify that all components are working correctly.
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const testFiles = [
  'test-system-overview.js',
  'test-flag-evaluation.js',
  'test-tenant-provisioning.js',
  'test-multi-tenant-architecture.js',
  'test-admin-workflow.js',
  'test-user-profile-management.js',
  'test-api-key-management.js'
];

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

console.log(`${colors.cyan}🚀 EasyFlags Flow Testing Suite${colors.reset}`);
console.log(`${colors.cyan}============================${colors.reset}\n`);

// Ensure all test files are executable
testFiles.forEach(file => {
  const testPath = path.join(__dirname, file);
  if (fs.existsSync(testPath)) {
    try {
      fs.chmodSync(testPath, '755');
    } catch (error) {
      console.error(`${colors.yellow}Warning: Could not make ${file} executable: ${error.message}${colors.reset}`);
    }
  } else {
    console.error(`${colors.red}Error: Test file ${file} not found${colors.reset}`);
  }
});

// Check if a specific test was specified
const specificTest = process.argv[2];
const testsToRun = specificTest 
  ? testFiles.filter(t => t.includes(specificTest))
  : testFiles;

if (specificTest && testsToRun.length === 0) {
  console.error(`${colors.red}Error: No tests match the pattern '${specificTest}'${colors.reset}`);
  process.exit(1);
}

// Run the tests
const results = [];
for (const testFile of testsToRun) {
  const testName = testFile.replace('.js', '').replace('test-', '');
  
  console.log(`\n${colors.magenta}Running test: ${testName}${colors.reset}`);
  console.log(`${colors.magenta}${'='.repeat(testName.length + 13)}${colors.reset}\n`);
  
  const startTime = Date.now();
  const result = spawnSync('node', [path.join(__dirname, testFile)], {
    stdio: 'inherit',
    env: {
      ...process.env,
      // Add any environment variables needed by all tests
      NODE_ENV: 'test'
    }
  });
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  results.push({
    name: testName,
    success: result.status === 0,
    duration
  });
}

// Print summary
console.log(`\n${colors.cyan}Test Summary${colors.reset}`);
console.log(`${colors.cyan}============${colors.reset}\n`);

let passCount = 0;

results.forEach(result => {
  const statusColor = result.success ? colors.green : colors.red;
  const statusText = result.success ? 'PASS' : 'FAIL';
  
  console.log(`${statusColor}${statusText}${colors.reset} - ${result.name} (${result.duration.toFixed(2)}s)`);
  
  if (result.success) {
    passCount++;
  }
});

const overallSuccess = passCount === results.length;
const overallColor = overallSuccess ? colors.green : colors.red;
const overallStatus = overallSuccess ? 'SUCCESS' : 'FAILURE';

console.log(`\n${overallColor}OVERALL: ${overallStatus} - ${passCount}/${results.length} tests passed${colors.reset}`);

// Exit with appropriate code
process.exit(overallSuccess ? 0 : 1); 