import { describe, it, expect } from 'vitest';
import { htmlToMarkdown } from '../utils/htmlToMarkdown';

describe('Export Validation & HTML to Markdown Converter', () => {
  it('should return plain text as-is if no HTML tags are present', () => {
    const text = 'Hello world, this is plain text.';
    expect(htmlToMarkdown(text)).toBe(text);
  });

  it('should convert headings and formatting correctly', () => {
    const html = '<h1>Title</h1><p>This is <strong>bold</strong> and <em>italic</em>.</p>';
    const md = htmlToMarkdown(html);
    expect(md).toContain('# Title');
    expect(md).toContain('**bold**');
    expect(md).toContain('*italic*');
  });

  it('should convert code blocks correctly', () => {
    const html = '<pre><code>const a = 1;</code></pre>';
    const md = htmlToMarkdown(html);
    expect(md).toContain('```');
    expect(md).toContain('const a = 1;');
  });

  it('should convert lists and tables correctly', () => {
    const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
    const md = htmlToMarkdown(html);
    expect(md).toContain('- Item 1');
    expect(md).toContain('- Item 2');
  });
});
