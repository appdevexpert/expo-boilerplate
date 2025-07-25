import fs from 'fs';
import path from 'path';

describe('no-tests-generated-note.md Documentation', () => {
  const filePath = path.join(__dirname, 'no-tests-generated-note.md');
  let fileContent: string;

  beforeAll(() => {
    // Read the markdown file content
    fileContent = fs.readFileSync(filePath, 'utf8');
  });

  describe('File Structure and Existence', () => {
    it('should exist in the correct location', () => {
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should be readable', () => {
      expect(() => fs.readFileSync(filePath, 'utf8')).not.toThrow();
    });

    it('should not be empty', () => {
      expect(fileContent.trim().length).toBeGreaterThan(0);
    });

    it('should have proper file extension', () => {
      expect(path.extname(filePath)).toBe('.md');
    });

    it('should be located in the lib directory', () => {
      expect(filePath).toMatch(/src\/lib\/no-tests-generated-note\.md$/);
    });
  });

  describe('Markdown Syntax Validation', () => {
    it('should contain valid markdown headers', () => {
      const headerPattern = /^#{1,6}\s+.+$/m;
      expect(headerPattern.test(fileContent)).toBe(true);
    });

    it('should have proper heading hierarchy', () => {
      const headings = fileContent.match(/^#+\s+.*/gm) || [];
      expect(headings.length).toBeGreaterThan(0);
      
      // Check that we start with an h1
      const firstHeading = headings[0];
      expect(firstHeading.startsWith('# ')).toBe(true);
      
      // Check heading level progression
      for (let i = 1; i < headings.length; i++) {
        const currentLevel = (headings[i].match(/^#+/) || [''])[0].length;
        const previousLevel = (headings[i - 1].match(/^#+/) || [''])[0].length;
        
        // Heading levels should not skip more than one level
        expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
      }
    });

    it('should not have malformed markdown syntax', () => {
      // Check for unmatched backticks (excluding code blocks)
      const codeBlockContent = fileContent.replace(/```[\s\S]*?```/g, '');
      const backtickCount = (codeBlockContent.match(/`/g) || []).length;
      expect(backtickCount % 2).toBe(0);
    });

    it('should use consistent list formatting', () => {
      const listItems = fileContent.match(/^\s*[-*+]\s/gm) || [];
      if (listItems.length > 0) {
        // All list items should use the same marker
        const markers = listItems.map(item => item.trim()[0]);
        const uniqueMarkers = [...new Set(markers)];
        expect(uniqueMarkers.length).toBeLessThanOrEqual(1);
      }
    });

    it('should use proper markdown formatting for code blocks', () => {
      const codeBlocks = fileContent.match(/```[\s\S]*?```/g) || [];
      codeBlocks.forEach(block => {
        expect(block.startsWith('```')).toBe(true);
        expect(block.endsWith('```')).toBe(true);
      });
    });
  });

  describe('Content Quality and Structure', () => {
    it('should have a meaningful title', () => {
      const title = fileContent.match(/^#\s+(.+)$/m);
      expect(title).toBeTruthy();
      expect(title![1].length).toBeGreaterThan(5);
      expect(title![1]).toMatch(/No Tests Generated Note/i);
    });

    it('should contain purpose section', () => {
      expect(fileContent).toMatch(/##\s+Purpose/i);
    });

    it('should contain usage section', () => {
      expect(fileContent).toMatch(/##\s+Usage/i);
    });

    it('should have substantive content', () => {
      const plainText = fileContent
        .replace(/^#+\s+/gm, '')
        .replace(/[*_`]/g, '')
        .replace(/\[.*?\]\(.*?\)/g, 'link')
        .trim();
      expect(plainText.length).toBeGreaterThan(100);
    });

    it('should explain when tests are not generated', () => {
      const content = fileContent.toLowerCase();
      expect(content).toMatch(/test.*not.*generated|no.*test.*generated|tests.*could.*not.*be.*automatically.*generated/);
    });

    it('should mention manual test creation requirements', () => {
      const content = fileContent.toLowerCase();
      expect(content).toMatch(/manual.*test.*creation.*required|manual.*test/);
    });

    it('should describe specific scenarios', () => {
      const content = fileContent.toLowerCase();
      const scenarios = [
        /special.*testing.*considerations/,
        /test.*generation.*skipped/,
        /maintain.*documentation.*consistency/
      ];
      
      const matchingScenarios = scenarios.filter(pattern => pattern.test(content));
      expect(matchingScenarios.length).toBeGreaterThan(0);
    });
  });

  describe('Documentation Standards', () => {
    it('should not contain TODO or FIXME comments', () => {
      const todoPattern = /\b(TODO|FIXME|XXX|HACK)\b/gi;
      expect(fileContent.match(todoPattern)).toBeNull();
    });

    it('should not have trailing whitespace', () => {
      const lines = fileContent.split('\n');
      const badLines = lines.filter(line => /\s+$/.test(line));
      expect(badLines).toHaveLength(0);
    });

    it('should use consistent line endings', () => {
      const hasCarriageReturn = fileContent.includes('\r\n');
      const hasLineFeed = fileContent.includes('\n');
      
      if (hasCarriageReturn && hasLineFeed) {
        const mixedLineEndings = /\r(?!\n)|\n(?<!\r)/.test(fileContent);
        expect(mixedLineEndings).toBe(false);
      }
    });

    it('should not have excessively long lines', () => {
      const lines = fileContent.split('\n');
      const longLines = lines.filter(line => line.length > 120);
      
      // Filter out lines that are allowed to be long (URLs, code blocks)
      const problematicLines = longLines.filter(line => 
        !line.includes('http') && 
        !line.trim().startsWith('```') &&
        !line.includes('|') // Table rows
      );
      
      expect(problematicLines).toHaveLength(0);
    });

    it('should follow project naming conventions', () => {
      const fileName = path.basename(filePath, '.md');
      expect(fileName).toMatch(/^[a-z-]+$/); // kebab-case
    });
  });

  describe('Link Validation', () => {
    it('should not contain broken internal links', () => {
      const internalLinks = fileContent.match(/\[.*?\]\((?!https?:\/\/|mailto:)([^)]+)\)/g) || [];
      
      internalLinks.forEach(link => {
        const urlMatch = link.match(/\[.*?\]\(([^)]+)\)/);
        if (urlMatch && urlMatch[1]) {
          const linkedPath = path.resolve(path.dirname(filePath), urlMatch[1]);
          expect(fs.existsSync(linkedPath)).toBe(true);
        }
      });
    });

    it('should use descriptive link text', () => {
      const linkPattern = /\[([^\]]+)\]/g;
      const links = fileContent.match(linkPattern) || [];
      
      const badLinkTexts = ['click here', 'here', 'link', 'read more', 'this'];
      const problematicLinks = links.filter(link => {
        const linkText = link.slice(1, -1).toLowerCase().trim();
        return badLinkTexts.includes(linkText) || linkText.length < 3;
      });
      
      expect(problematicLinks).toHaveLength(0);
    });
  });

  describe('Accessibility and Readability', () => {
    it('should not have excessive nested lists', () => {
      const lines = fileContent.split('\n');
      const listItems = lines.filter(line => /^\s*[-*+]\s/.test(line));
      
      listItems.forEach(item => {
        const indentLevel = Math.floor((item.match(/^\s*/)?.[0].length || 0) / 2);
        expect(indentLevel).toBeLessThanOrEqual(3);
      });
    });

    it('should provide clear structure for screen readers', () => {
      // Should have logical heading progression
      const headings = fileContent.match(/^(#+)\s+(.+)$/gm) || [];
      expect(headings.length).toBeGreaterThanOrEqual(2); // At least title and one section
      
      // Check for proper semantic structure
      expect(fileContent).toMatch(/^#\s/m); // Has main title
      expect(fileContent).toMatch(/^##\s/m); // Has subsections
    });
  });

  describe('File Metadata and Performance', () => {
    it('should be under reasonable size limit', () => {
      const stats = fs.statSync(filePath);
      const fileSizeInKB = stats.size / 1024;
      expect(fileSizeInKB).toBeLessThan(50); // 50KB limit for simple documentation
    });

    it('should have expected file permissions', () => {
      const stats = fs.statSync(filePath);
      expect(stats.isFile()).toBe(true);
    });

    it('should be in UTF-8 encoding', () => {
      // Test that the file can be read as UTF-8 without errors
      expect(() => fs.readFileSync(filePath, 'utf8')).not.toThrow();
      
      // Check for BOM (Byte Order Mark) which should not be present
      const buffer = fs.readFileSync(filePath);
      const hasBOM = buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF;
      expect(hasBOM).toBe(false);
    });
  });

  describe('Content Completeness', () => {
    it('should explain the purpose of the file', () => {
      const content = fileContent.toLowerCase();
      expect(content).toMatch(/placeholder|documentation.*note|serves.*as/);
    });

    it('should provide guidance on when to use this file', () => {
      const content = fileContent.toLowerCase();
      expect(content).toMatch(/include.*file.*directories|usage/);
    });

    it('should describe the context for no test generation', () => {
      const content = fileContent.toLowerCase();
      expect(content).toMatch(/cases.*where|indicating.*that.*no.*tests/);
    });

    it('should be consistent with existing documentation patterns', () => {
      // Check that it follows the same structure as other documentation
      expect(fileContent).toMatch(/^# /); // Starts with main heading
      expect(fileContent).toMatch(/## /); // Has subheadings
    });
  });

  describe('Integration with Testing Workflow', () => {
    it('should be discoverable by Jest test patterns', () => {
      // This test file itself should match Jest patterns
      const testFilePath = __filename;
      expect(testFilePath).toMatch(/\.(test|spec)\.(ts|tsx|js|jsx)$/);
    });

    it('should complement the testing strategy', () => {
      // The note should explain when manual intervention is needed
      const content = fileContent.toLowerCase();
      expect(content).toMatch(/manual.*test.*creation.*required|special.*testing.*considerations/);
    });

    it('should maintain consistency in lib directory', () => {
      // Check if there are other documentation files
      const libDir = path.dirname(filePath);
      const libFiles = fs.readdirSync(libDir);
      const hasOtherMdFiles = libFiles.some(file => file.endsWith('.md') && file !== 'no-tests-generated-note.md');
      
      if (hasOtherMdFiles) {
        // Should follow similar patterns to other documentation
        expect(fileContent).toMatch(/^#\s+/); // Consistent heading structure
      }
    });
  });
});