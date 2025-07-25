#!/usr/bin/env node

const { MarkdownValidator } = require('../src/lib/__tests__/markdown-validator');
const path = require('path');

function main() {
  const args = process.argv.slice(2);
  const targetPath = args[0] || 'src/lib/no-tests-generated-note.md';
  const recursive = args.includes('--recursive') || args.includes('-r');
  const verbose = args.includes('--verbose') || args.includes('-v');

  console.log('🔍 Markdown Validation Tool');
  console.log('=' .repeat(30));
  
  let results;
  
  if (require('fs').lstatSync(targetPath).isDirectory()) {
    console.log(`📁 Validating directory: ${targetPath}`);
    if (recursive) {
      console.log('🔄 Recursive mode enabled');
      results = MarkdownValidator.validateDirectoryRecursive(targetPath);
    } else {
      results = MarkdownValidator.validateDirectory(targetPath);
    }
  } else {
    console.log(`📄 Validating file: ${targetPath}`);
    const result = MarkdownValidator.validateFile(targetPath);
    results = { [targetPath]: result };
  }

  if (verbose || Object.keys(results).length > 0) {
    console.log(MarkdownValidator.formatResults(results));
  }

  // Exit with error code if any files are invalid
  const hasErrors = Object.values(results).some(result => !result.isValid);
  process.exit(hasErrors ? 1 : 0);
}

if (require.main === module) {
  main();
}