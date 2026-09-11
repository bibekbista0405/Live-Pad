/**
 * Smart Punctuation rules across English and localized terms
 */
export function applySmartPunctuation(text: string, langCode: string = 'en-US'): string {
  if (!text) return '';

  let result = text;

  // English smart punctuation replacements
  if (langCode.startsWith('en')) {
    result = result
      .replace(/\b(period|full stop)\b/gi, '.')
      .replace(/\b(comma)\b/gi, ',')
      .replace(/\b(question mark)\b/gi, '?')
      .replace(/\b(exclamation mark|exclamation point)\b/gi, '!')
      .replace(/\b(colon)\b/gi, ':')
      .replace(/\b(semicolon)\b/gi, ';')
      .replace(/\b(open quote|start quote)\b/gi, '"')
      .replace(/\b(close quote|end quote)\b/gi, '"')
      .replace(/\b(open parenthesis)\b/gi, '(')
      .replace(/\b(close parenthesis)\b/gi, ')')
      .replace(/\b(ellipsis|dot dot dot)\b/gi, '...');
  }

  // Devanagari (Nepali / Hindi) smart punctuation
  if (langCode === 'ne-NP' || langCode === 'hi-IN') {
    result = result
      .replace(/\b(पूर्णविराम|पुर्णविराम|पूर्ण विराम|विराम)\b/gi, '।')
      .replace(/\b(कमा|कम्मा)\b/gi, ',')
      .replace(/\b(प्रश्न चिन्ह|प्रश्नचिन्ह)\b/gi, '?')
      .replace(/\b(विस्मयादिबोधक)\b/gi, '!');
  }

  // General cleanups: spacing before punctuation marks
  result = result
    .replace(/\s+([.,!?:;])/g, '$1') // Remove spaces before punctuation
    .replace(/([.,!?:;])([^\s"'\)\d])/g, '$1 $2') // Ensure space after punctuation
    .replace(/\s+/g, ' ');

  // Auto-capitalize first letter of sentences
  result = result.replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());

  return result;
}
