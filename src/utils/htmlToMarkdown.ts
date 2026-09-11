export function htmlToMarkdown(html: string): string {
  if (!html) return '';
  
  // If the content does not contain HTML tags, it is already raw Markdown/plain text
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    return html;
  }

  let md = html;

  // Replace line breaks
  md = md.replace(/<br\s*\/?>/gi, '\n');

  // Headings
  md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '# $1\n\n');
  md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1\n\n');
  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1\n\n');
  md = md.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '#### $1\n\n');
  md = md.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, '##### $1\n\n');
  md = md.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, '###### $1\n\n');

  // Code blocks
  md = md.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, code) => {
    const unescaped = code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    return `\n\`\`\`\n${unescaped.trim()}\n\`\`\`\n\n`;
  });

  // Inline code
  md = md.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');

  // Blockquotes
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, text) => {
    const clean = text.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n').trim();
    return `> ${clean.split('\n').join('\n> ')}\n\n`;
  });

  // Bold / Strong
  md = md.replace(/<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, '**$1**');

  // Italic / Em
  md = md.replace(/<(?:em|i)[^>]*>([\s\S]*?)<\/(?:em|i)>/gi, '*$1*');

  // Strikethrough
  md = md.replace(/<(?:s|del|strike)[^>]*>([\s\S]*?)<\/(?:s|del|strike)>/gi, '~~$1~~');

  // Links
  md = md.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

  // Images
  md = md.replace(/<img[^>]*src=["']([^"']*)["'][^>]*alt=["']([^"']*)["'][^>]*\/?>/gi, '![$2]($1)');
  md = md.replace(/<img[^>]*src=["']([^"']*)["'][^>]*\/?>/gi, '![]($1)');

  // Task items
  md = md.replace(/<li[^>]*data-type="taskItem"[^>]*data-checked="true"[^>]*>([\s\S]*?)<\/li>/gi, '- [x] $1\n');
  md = md.replace(/<li[^>]*data-type="taskItem"[^>]*data-checked="false"[^>]*>([\s\S]*?)<\/li>/gi, '- [ ] $1\n');

  // Lists
  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, items) => {
    return items.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n') + '\n';
  });

  md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, items) => {
    let index = 1;
    return items.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, () => `${index++}. $1\n`) + '\n';
  });

  // Paragraphs
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n');

  // Tables
  md = md.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_, tableContent) => {
    const rows: string[][] = [];
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let match;
    while ((match = rowRegex.exec(tableContent)) !== null) {
      const cellContent = match[1];
      const cells: string[] = [];
      const cellRegex = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
      let cellMatch;
      while ((cellMatch = cellRegex.exec(cellContent)) !== null) {
        cells.push(cellMatch[1].replace(/<[^>]+>/g, '').trim());
      }
      if (cells.length > 0) rows.push(cells);
    }

    if (rows.length === 0) return '';

    let tableMd = '\n';
    tableMd += '| ' + rows[0].join(' | ') + ' |\n';
    tableMd += '| ' + rows[0].map(() => '---').join(' | ') + ' |\n';
    for (let i = 1; i < rows.length; i++) {
      tableMd += '| ' + rows[i].join(' | ') + ' |\n';
    }
    return tableMd + '\n';
  });

  // Strip any remaining html tags
  md = md.replace(/<[^>]+>/g, '');

  // Unescape HTML entities
  md = md
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Clean up excessive blank lines
  md = md.replace(/\n{3,}/g, '\n\n').trim();

  return md;
}
