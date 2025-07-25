import fs from 'fs';
import path from 'path';
import { MarkdownValidator, ValidationResult } from './markdown-validator';

describe('MarkdownValidator', () => {
  const testDir = path.join(__dirname, 'test-temp');
  const testFilePath = path.join(testDir, 'test.md');

  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test files and directory
    if (fs.existsSync(testDir)) {
      const files = fs.readdirSync(testDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(testDir, file));
      });
      fs.rmdirSync(testDir);
    }
  });

  describe('validateFile', () => {
    it('should return invalid for non-existent file', () => {
      const result = MarkdownValidator.validateFile('non-existent.md');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File does not exist');
      expect(result.filePath).toBe('non-existent.md');
    });

    it('should return invalid for empty file', () => {
      fs.writeFileSync(testFilePath, '');
      const result = MarkdownValidator.validateFile(testFilePath);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File is empty');
    });

    it('should validate proper markdown file', () => {
      const content = `# Test Document

This is a test document with proper markdown syntax.

## Section 1

Some content here.

- List item 1
- List item 2

**Bold text** and *italic text*.

\`inline code\` and code blocks:

\`\`\`javascript
console.log('Hello world');
\`\`\`
`;
      fs.writeFileSync(testFilePath, content);
      const result = MarkdownValidator.validateFile(testFilePath);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect trailing whitespace', () => {
      const content = 'Line with trailing space \nNormal line\n';
      fs.writeFileSync(testFilePath, content);
      const result = MarkdownValidator.validateFile(testFilePath);
      expect(result.warnings.some(w => w.includes('trailing whitespace'))).toBe(true);
    });

    it('should detect broken internal links', () => {
      const content = '# Test\n[Broken link](./non-existent-file.md)';
      fs.writeFileSync(testFilePath, content);
      const result = MarkdownValidator.validateFile(testFilePath);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Broken internal link'))).toBe(true);
    });

    it('should warn about heading hierarchy issues', () => {
      const content = '# Title\n### Skipped H2\nContent';
      fs.writeFileSync(testFilePath, content);
      const result = MarkdownValidator.validateFile(testFilePath);
      expect(result.warnings.some(w => w.includes('Heading level skips'))).toBe(true);
    });

    it('should detect unmatched backticks', () => {
      const content = '# Test\nThis has `unmatched backtick\nEnd';
      fs.writeFileSync(testFilePath, content);
      const result = MarkdownValidator.validateFile(testFilePath);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Unmatched backticks'))).toBe(true);
    });

    it('should not flag properly paired backticks', () => {
      const content = '# Test\nThis has `matched` backticks and ```\ncode block\n```';
      fs.writeFileSync(testFilePath, content);
      const result = MarkdownValidator.validateFile(testFilePath);
      expect(result.errors.some(e => e.includes('Unmatched backticks'))).toBe(false);
    });
  });

  describe('validateDirectory', () => {
    it('should return empty object for non-existent directory', () => {
      const results = MarkdownValidator.validateDirectory('./non-existent-dir');
      expect(Object.keys(results)).toHaveLength(0);
    });

    it('should validate all markdown files in directory', () => {
      const testFile1 = path.join(testDir, 'test1.md');
      const testFile2 = path.join(testDir, 'test2.md');
      const testFile3 = path.join(testDir, 'test.txt'); // Not markdown

      fs.writeFileSync(testFile1, '# Test 1\nContent');
      fs.writeFileSync(testFile2, '# Test 2\nContent');
      fs.writeFileSync(testFile3, 'Not markdown');

      const results = MarkdownValidator.validateDirectory(testDir);
      expect(Object.keys(results)).toHaveLength(2); // Only .md files
      expect(results[testFile1].isValid).toBe(true);
      expect(results[testFile2].isValid).toBe(true);
    });
  });

  describe('validateDirectoryRecursive', () => {
    it('should validate markdown files recursively', () => {
      const subDir = path.join(testDir, 'subdir');
      fs.mkdirSync(subDir, { recursive: true });
      
      const rootFile = path.join(testDir, 'root.md');
      const subFile = path.join(subDir, 'sub.md');
      
      fs.writeFileSync(rootFile, '# Root\nContent');
      fs.writeFileSync(subFile, '# Sub\nContent');

      const results = MarkdownValidator.validateDirectoryRecursive(testDir);
      expect(Object.keys(results)).toHaveLength(2);
      expect(results[rootFile].isValid).toBe(true);
      expect(results[subFile].isValid).toBe(true);
    });
  });

  describe('formatResults', () => {
    it('should format results correctly', () => {
      const results = {
        'file1.md': {
          isValid: true,
          errors: [],
          warnings: [],
          filePath: 'file1.md'
        },
        'file2.md': {
          isValid: false,
          errors: ['Test error'],
          warnings: ['Test warning'],
          filePath: 'file2.md'
        }
      };

      const formatted = MarkdownValidator.formatResults(results);
      expect(formatted).toContain('Summary: 1/2 files valid');
      expect(formatted).toContain('✅ file1.md');
      expect(formatted).toContain('❌ file2.md');
      expect(formatted).toContain('Error: Test error');
      expect(formatted).toContain('Warning: Test warning');
    });
  });
});