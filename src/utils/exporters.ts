/**
 * Content Export Handlers for LivePad
 * Delegated to ExportService to ensure document-only export.
 */
import { Editor } from '@tiptap/react';

export function convertHtmlToMarkdown(htmlOrText: string): string {
  if (!htmlOrText || !htmlOrText.trim()) return '';

  if (!/<[a-z][\s\S]*>/i.test(htmlOrText)) {
    return htmlOrText.trim();
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlOrText, 'text/html');

  function walk(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    let childrenText = '';
    el.childNodes.forEach(child => {
      childrenText += walk(child);
    });

    switch (tag) {
      case 'h1': return `\n# ${childrenText.trim()}\n\n`;
      case 'h2': return `\n## ${childrenText.trim()}\n\n`;
      case 'h3': return `\n### ${childrenText.trim()}\n\n`;
      case 'h4': return `\n#### ${childrenText.trim()}\n\n`;
      case 'h5': return `\n##### ${childrenText.trim()}\n\n`;
      case 'h6': return `\n###### ${childrenText.trim()}\n\n`;
      case 'p': return `\n${childrenText.trim()}\n\n`;
      case 'strong':
      case 'b': return `**${childrenText}**`;
      case 'em':
      case 'i': return `*${childrenText}*`;
      case 'u': return `<u>${childrenText}</u>`;
      case 's':
      case 'del': return `~~${childrenText}~~`;
      case 'mark': return `==${childrenText}==`;
      case 'code': return el.parentElement?.tagName.toLowerCase() === 'pre' ? childrenText : `\`${childrenText}\``;
      case 'pre': return `\n\`\`\`\n${childrenText.trim()}\n\`\`\`\n\n`;
      case 'blockquote': return `\n> ${childrenText.trim().replace(/\n/g, '\n> ')}\n\n`;
      case 'li': {
        const isTask = el.getAttribute('data-type') === 'taskItem';
        const isChecked = el.getAttribute('data-checked') === 'true' || el.querySelector('input[type="checkbox"]:checked') !== null;
        if (isTask) return `- [${isChecked ? 'x' : ' '}] ${childrenText.trim()}\n`;
        return `- ${childrenText.trim()}\n`;
      }
      case 'ul':
      case 'ol': return `\n${childrenText}\n`;
      case 'a': return `[${childrenText}](${el.getAttribute('href') || '#'})`;
      case 'img': return `![${el.getAttribute('alt') || 'image'}](${el.getAttribute('src') || ''})`;
      case 'hr': return `\n---\n\n`;
      case 'br': return '\n';
      default: return childrenText;
    }
  }

  return walk(doc.body).replace(/\n{3,}/g, '\n\n').trim();
}

export async function exportToTxt(roomCode: string, editorOrContent: Editor | string | null, addToast?: (type: 'success' | 'error' | 'info', message: string) => void) {
  const { ExportService } = await import('../services/exportService');
  ExportService.exportToTxt({
    title: roomCode,
    content: editorOrContent,
    addToast
  });
}

export async function exportToPdf(
  roomCode: string,
  editorOrContent: Editor | string | null,
  addToast?: (type: 'success' | 'error' | 'info', message: string) => void
) {
  const { ExportService } = await import('../services/exportService');
  ExportService.exportToPdf({
    title: roomCode,
    content: editorOrContent,
    addToast
  });
}

export async function exportToDocx(
  roomCode: string,
  editorOrContent: Editor | string | null,
  addToast?: (type: 'success' | 'error' | 'info', message: string) => void
) {
  const { ExportService } = await import('../services/exportService');
  ExportService.exportToDocx({
    title: roomCode,
    content: editorOrContent,
    addToast
  });
}

export async function exportToHtml(
  roomCode: string,
  editorOrContent: Editor | string | null,
  addToast?: (type: 'success' | 'error' | 'info', message: string) => void
) {
  const { ExportService } = await import('../services/exportService');
  ExportService.exportToHtml({
    title: roomCode,
    content: editorOrContent,
    addToast
  });
}

export async function exportToMarkdown(
  roomCode: string,
  editorOrContent: Editor | string | null,
  addToast?: (type: 'success' | 'error' | 'info', message: string) => void
) {
  const { ExportService } = await import('../services/exportService');
  ExportService.exportToMarkdown({
    title: roomCode,
    content: editorOrContent,
    addToast
  });
}

export async function exportToEpub(
  roomCode: string,
  editorOrContent: Editor | string | null,
  addToast?: (type: 'success' | 'error' | 'info', message: string) => void
) {
  const { ExportService } = await import('../services/exportService');
  ExportService.exportToEpub({
    title: roomCode,
    content: editorOrContent,
    addToast
  });
}

export async function printDocument(
  roomCode: string,
  editorOrContent: Editor | string | null,
  addToast?: (type: 'success' | 'error' | 'info', message: string) => void,
  skipConfirmation?: boolean
) {
  const { ExportService } = await import('../services/exportService');
  ExportService.printDocument({
    title: roomCode,
    content: editorOrContent,
    addToast,
    skipConfirmation
  });
}
