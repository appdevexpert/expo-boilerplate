import fs from 'fs';
import path from 'path';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  filePath: string;
}

export class MarkdownValidator {
  /**
   * Validates a single markdown file
   */
  static validateFile(filePath: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      filePath
    };

    if (!fs.existsSync(filePath)) {
      result.errors.push('File does not exist');
      result.isValid = false;
      return result;
    }

    const content = fs.readFileSync(filePath, 'utf8');

    // Check for empty file
    if (content.trim().length === 0) {
      result.errors.push('File is empty');
      result.isValid = false;
    }

    // Check for valid markdown syntax
    if (!/^#|^##|^###|\*\*|\*|`|>|\[.*\]\(.*\)/m.test(content)) {
      result.warnings.push('No clear markdown syntax detected');
    }

    // Check for trailing whitespace
    const lines = content.split('\n');
    const linesWithTrailingSpace = lines.filter(line => /\s+$/.test(line));
    if (linesWithTrailingSpace.length > 0) {
      result.warnings.push(`Found ${linesWithTrailingSpace.length} lines with trailing whitespace`);
    }

    // Check for broken internal links
    const internalLinks = content.match(/\[.*?\]\((?!https?:\/\/|mailto:)([^)]+)\)/g) || [];
    let brokenLinks = 0;

    internalLinks.forEach(link => {
      const urlMatch = link.match(/\[.*?\]\(([^)]+)\)/);
      if (urlMatch && urlMatch[1]) {
        const linkedPath = path.resolve(path.dirname(filePath), urlMatch[1]);
        if (!fs.existsSync(linkedPath)) {
          result.errors.push(`Broken internal link: ${urlMatch[1]}`);
          brokenLinks++;
        }
      }
    });

    if (brokenLinks > 0) {
      result.isValid = false;
    }

    // Check heading hierarchy
    const headings = content.match(/^#+\s+.*/gm) || [];
    let previousLevel = 0;

    headings.forEach((heading, index) => {
      const level = (heading.match(/^#+/) || [''])[0].length;
      if (index === 0 && level !== 1) {
        result.warnings.push('Document should start with an h1 heading');
      }
      if (level - previousLevel > 1) {
        result.warnings.push(`Heading level skips detected: ${heading.trim()}`);
      }
      previousLevel = level;
    });

    // Check for malformed backticks
    const codeBlockContent = content.replace(/```[\s\S]*?```/g, '');
    const backtickCount = (codeBlockContent.match(/`/g) || []).length;
    if (backtickCount % 2 !== 0) {
      result.errors.push('Unmatched backticks detected');
      result.isValid = false;
    }

    // Check file size
    const stats = fs.statSync(filePath);
    const fileSizeInKB = stats.size / 1024;
    if (fileSizeInKB > 100) {
      result.warnings.push(`File is large (${fileSizeInKB.toFixed(2)}KB)`);
    }

    return result;
  }

  /**
   * Validates all markdown files in a directory
   */
  static validateDirectory(dirPath: string): Record<string, ValidationResult> {
    const results: Record<string, ValidationResult> = {};
    
    if (!fs.existsSync(dirPath)) {
      return results;
    }

    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    
    files.forEach(dirent => {
      if (dirent.isFile() && dirent.name.endsWith('.md')) {
        const filePath = path.join(dirPath, dirent.name);
        results[filePath] = this.validateFile(filePath);
      }
    });

    return results;
  }

  /**
   * Validates all markdown files recursively in a directory tree
   */
  static validateDirectoryRecursive(dirPath: string): Record<string, ValidationResult> {
    const results: Record<string, ValidationResult> = {};
    
    const walkDir = (currentPath: string) => {
      if (!fs.existsSync(currentPath)) {
        return;
      }

      const files = fs.readdirSync(currentPath, { withFileTypes: true });
      
      files.forEach(dirent => {
        const fullPath = path.join(currentPath, dirent.name);
        
        if (dirent.isFile() && dirent.name.endsWith('.md')) {
          results[fullPath] = this.validateFile(fullPath);
        } else if (dirent.isDirectory() && !dirent.name.startsWith('.') && dirent.name !== 'node_modules') {
          walkDir(fullPath);
        }
      });
    };

    walkDir(dirPath);
    return results;
  }

  /**
   * Formats validation results for console output
   */
  static formatResults(results: Record<string, ValidationResult>): string {
    const output: string[] = [];
    let totalFiles = 0;
    let validFiles = 0;
    let totalErrors = 0;
    let totalWarnings = 0;

    Object.entries(results).forEach(([filePath, result]) => {
      totalFiles++;
      totalErrors += result.errors.length;
      totalWarnings += result.warnings.length;
      
      if (result.isValid) {
        validFiles++;
        output.push(`✅ ${filePath}`);
      } else {
        output.push(`❌ ${filePath}`);
      }

      result.errors.forEach(error => {
        output.push(`   Error: ${error}`);
      });

      result.warnings.forEach(warning => {
        output.push(`   Warning: ${warning}`);
      });

      if (result.errors.length > 0 || result.warnings.length > 0) {
        output.push('');
      }
    });

    output.unshift('');
    output.unshift(`📊 Summary: ${validFiles}/${totalFiles} files valid, ${totalErrors} errors, ${totalWarnings} warnings`);
    output.unshift('Markdown Validation Results');
    output.unshift('='.repeat(30));

    return output.join('\n');
  }
}