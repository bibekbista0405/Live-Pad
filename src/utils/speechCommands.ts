import type { RefObject } from 'react';
import { VoiceCommandMatch } from '../types/dictation';

export function parseVoiceCommand(text: string): VoiceCommandMatch | null {
  const normalized = text.trim().toLowerCase();

  // Formatting & structure
  if (/\b(new line|line break)\b/i.test(normalized)) {
    return { command: text, type: 'new_line', cleanedText: text.replace(/\b(new line|line break)\b/gi, '').trim() };
  }
  if (/\b(new paragraph|next paragraph)\b/i.test(normalized)) {
    return { command: text, type: 'new_paragraph', cleanedText: text.replace(/\b(new paragraph|next paragraph)\b/gi, '').trim() };
  }
  if (/\b(bold this|make bold)\b/i.test(normalized)) {
    return { command: text, type: 'bold' };
  }
  if (/\b(italic|make italic)\b/i.test(normalized)) {
    return { command: text, type: 'italic' };
  }
  if (/\b(underline|make underline)\b/i.test(normalized)) {
    return { command: text, type: 'underline' };
  }
  if (/\b(heading one|header one|heading 1|header 1)\b/i.test(normalized)) {
    return { command: text, type: 'heading_1' };
  }
  if (/\b(heading two|header two|heading 2|header 2)\b/i.test(normalized)) {
    return { command: text, type: 'heading_2' };
  }
  if (/\b(bullet list|bulleted list)\b/i.test(normalized)) {
    return { command: text, type: 'bullet_list' };
  }
  if (/\b(number list|numbered list)\b/i.test(normalized)) {
    return { command: text, type: 'number_list' };
  }
  if (/\b(insert checkbox|task list)\b/i.test(normalized)) {
    return { command: text, type: 'insert_checkbox' };
  }
  if (/\b(insert code block|code snippet)\b/i.test(normalized)) {
    return { command: text, type: 'insert_code' };
  }
  if (/\b(start quote|block quote)\b/i.test(normalized)) {
    return { command: text, type: 'start_quote' };
  }

  // Editing & Manipulation
  if (/\b(undo|undo that)\b/i.test(normalized)) {
    return { command: text, type: 'undo' };
  }
  if (/\b(redo|redo that)\b/i.test(normalized)) {
    return { command: text, type: 'redo' };
  }
  if (/\b(delete sentence|delete previous sentence)\b/i.test(normalized)) {
    return { command: text, type: 'delete_sentence' };
  }
  if (/\b(remove last word|delete last word)\b/i.test(normalized)) {
    return { command: text, type: 'remove_last_word' };
  }
  if (/\b(select previous paragraph|select paragraph)\b/i.test(normalized)) {
    return { command: text, type: 'select_paragraph' };
  }
  if (/\b(capitalize this|capitalize selection)\b/i.test(normalized)) {
    return { command: text, type: 'capitalize' };
  }
  if (/\b(lowercase selection|make lowercase)\b/i.test(normalized)) {
    return { command: text, type: 'lowercase' };
  }

  // Replacement regex: e.g. "replace hello with world"
  const replaceMatch = normalized.match(/replace\s+(.+?)\s+with\s+(.+)/i);
  if (replaceMatch) {
    return {
      command: text,
      type: 'replace',
      params: { target: replaceMatch[1].trim(), replacement: replaceMatch[2].trim() }
    };
  }

  return null;
}

/**
 * Executes a parsed voice command on TipTap editor or textarea
 */
export function executeVoiceCommand(
  match: VoiceCommandMatch,
  editorInstance: any,
  textareaRef: RefObject<HTMLTextAreaElement | null>,
  currentContent: string,
  onUpdateContent: (val: string) => void
): boolean {
  if (editorInstance) {
    switch (match.type) {
      case 'new_line':
        editorInstance.chain().focus().setHardBreak().run();
        return true;
      case 'new_paragraph':
        editorInstance.chain().focus().splitBlock().run();
        return true;
      case 'bold':
        editorInstance.chain().focus().toggleBold().run();
        return true;
      case 'italic':
        editorInstance.chain().focus().toggleItalic().run();
        return true;
      case 'underline':
        editorInstance.chain().focus().toggleUnderline?.().run();
        return true;
      case 'heading_1':
        editorInstance.chain().focus().toggleHeading({ level: 1 }).run();
        return true;
      case 'heading_2':
        editorInstance.chain().focus().toggleHeading({ level: 2 }).run();
        return true;
      case 'bullet_list':
        editorInstance.chain().focus().toggleBulletList().run();
        return true;
      case 'number_list':
        editorInstance.chain().focus().toggleOrderedList().run();
        return true;
      case 'insert_checkbox':
        editorInstance.chain().focus().toggleTaskList?.().run();
        return true;
      case 'insert_code':
        editorInstance.chain().focus().toggleCodeBlock?.().run();
        return true;
      case 'start_quote':
        editorInstance.chain().focus().toggleBlockquote().run();
        return true;
      case 'undo':
        editorInstance.chain().focus().undo().run();
        return true;
      case 'redo':
        editorInstance.chain().focus().redo().run();
        return true;
      case 'delete_sentence': {
        const text = editorInstance.getText();
        const sentences = text.split(/(?<=[.!?])\s+/);
        if (sentences.length > 0) {
          sentences.pop();
          editorInstance.commands.setContent(sentences.join(' '));
        }
        return true;
      }
      case 'replace': {
        if (match.params?.target && match.params?.replacement) {
          const content = editorInstance.getHTML();
          const regex = new RegExp(match.params.target, 'gi');
          editorInstance.commands.setContent(content.replace(regex, match.params.replacement));
        }
        return true;
      }
    }
  }

  // Fallback to plain textarea or state content
  const textarea = textareaRef.current;
  if (textarea) {
    const start = textarea.selectionStart;
    const text = textarea.value;

    if (match.type === 'new_line') {
      const updated = text.substring(0, start) + '\n' + text.substring(start);
      onUpdateContent(updated);
      return true;
    }
    if (match.type === 'new_paragraph') {
      const updated = text.substring(0, start) + '\n\n' + text.substring(start);
      onUpdateContent(updated);
      return true;
    }
    if (match.type === 'remove_last_word') {
      const before = text.substring(0, start).trimEnd();
      const lastSpaceIndex = before.lastIndexOf(' ');
      const newBefore = lastSpaceIndex >= 0 ? before.substring(0, lastSpaceIndex) : '';
      const updated = newBefore + text.substring(start);
      onUpdateContent(updated);
      return true;
    }
    if (match.type === 'replace' && match.params?.target && match.params?.replacement) {
      const regex = new RegExp(match.params.target, 'gi');
      onUpdateContent(text.replace(regex, match.params.replacement));
      return true;
    }
  }

  return false;
}
