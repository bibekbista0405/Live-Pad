import { Extension } from '@tiptap/core';
import '@tiptap/extension-text-style';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

export const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace(/['"]+/g, '') || null,
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        fontSize =>
        ({ chain }) => {
          return chain()
            .setMark('textStyle', { fontSize })
            .run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain()
            .setMark('textStyle', { fontSize: null })
            .removeEmptyTextStyle()
            .run();
        },
    };
  },
});

/**
 * Converts legacy plain-text or Markdown strings into clean HTML
 * so that legacy documents open in rich text mode without raw tags.
 */
export function ensureHtmlContent(raw: string): string {
  if (!raw || !raw.trim()) {
    return '<p></p>';
  }

  const trimmed = raw.trim();
  // If it already looks like HTML block structure, return as is
  if (
    trimmed.startsWith('<p') ||
    trimmed.startsWith('<h1') ||
    trimmed.startsWith('<h2') ||
    trimmed.startsWith('<h3') ||
    trimmed.startsWith('<ul') ||
    trimmed.startsWith('<ol') ||
    trimmed.startsWith('<div') ||
    trimmed.startsWith('<blockquote') ||
    trimmed.startsWith('<table')
  ) {
    return raw;
  }

  // Convert plain text / Markdown lines into rich HTML paragraphs & headers
  const lines = raw.split('\n');
  const htmlLines: string[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' | null = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Format inline markdown constructs inside line
    line = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Re-enable allowed HTML tags if previously present
    line = line
      .replace(/&lt;u&gt;(.*?)&lt;\/u&gt;/gi, '<u>$1</u>')
      .replace(/&lt;mark&gt;(.*?)&lt;\/mark&gt;/gi, '<mark>$1</mark>');

    // Inline syntax replacements
    line = line
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/~~([^~]+)~~/g, '<s>$1</s>')
      .replace(/==([^=]+)==/g, '<mark>$1</mark>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headings
    if (line.startsWith('# ')) {
      if (inList) { htmlLines.push(`</${listType}>`); inList = false; }
      htmlLines.push(`<h1>${line.substring(2)}</h1>`);
      continue;
    }
    if (line.startsWith('## ')) {
      if (inList) { htmlLines.push(`</${listType}>`); inList = false; }
      htmlLines.push(`<h2>${line.substring(3)}</h2>`);
      continue;
    }
    if (line.startsWith('### ')) {
      if (inList) { htmlLines.push(`</${listType}>`); inList = false; }
      htmlLines.push(`<h3>${line.substring(4)}</h3>`);
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      if (inList) { htmlLines.push(`</${listType}>`); inList = false; }
      htmlLines.push(`<blockquote><p>${line.substring(2)}</p></blockquote>`);
      continue;
    }

    // Unordered List
    if (/^\s*[-*+]\s+/.test(line)) {
      const content = line.replace(/^\s*[-*+]\s+/, '');
      if (!inList || listType !== 'ul') {
        if (inList) htmlLines.push(`</${listType}>`);
        htmlLines.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      htmlLines.push(`<li><p>${content}</p></li>`);
      continue;
    }

    // Ordered List
    if (/^\s*\d+\.\s+/.test(line)) {
      const content = line.replace(/^\s*\d+\.\s+/, '');
      if (!inList || listType !== 'ol') {
        if (inList) htmlLines.push(`</${listType}>`);
        htmlLines.push('<ol>');
        inList = true;
        listType = 'ol';
      }
      htmlLines.push(`<li><p>${content}</p></li>`);
      continue;
    }

    // Close any open list if hit non-list line
    if (inList) {
      htmlLines.push(`</${listType}>`);
      inList = false;
      listType = null;
    }

    // Paragraph line or empty line
    if (!line.trim()) {
      htmlLines.push('<p></p>');
    } else {
      htmlLines.push(`<p>${line}</p>`);
    }
  }

  if (inList) {
    htmlLines.push(`</${listType}>`);
  }

  return htmlLines.join('');
}
