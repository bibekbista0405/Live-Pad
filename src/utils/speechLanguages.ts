import { DictationLanguage } from '../types/dictation';

export const SUPPORTED_DICTATION_LANGUAGES: DictationLanguage[] = [
  { code: 'en-US', name: 'English (United States)', nativeName: 'English (US)', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (United Kingdom)', nativeName: 'English (UK)', flag: '🇬🇧' },
  { code: 'en-IN', name: 'English (India)', nativeName: 'English (India)', flag: '🇮🇳' },
  { code: 'en-AU', name: 'English (Australia)', nativeName: 'English (Australia)', flag: '🇦🇺' },
  { code: 'en-CA', name: 'English (Canada)', nativeName: 'English (Canada)', flag: '🇨🇦' },
  { code: 'ne-NP', name: 'Nepali (Nepal)', nativeName: 'नेपाली', flag: '🇳🇵' },
  { code: 'hi-IN', name: 'Hindi (India)', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ja-JP', name: 'Japanese (Japan)', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'zh-CN', name: 'Chinese Mandarin (Simplified)', nativeName: '普通话', flag: '🇨🇳' },
  { code: 'zh-HK', name: 'Chinese Cantonese (Hong Kong)', nativeName: '粵語', flag: '🇭🇰' },
  { code: 'zh-TW', name: 'Chinese Mandarin (Traditional)', nativeName: '繁體中文', flag: '🇹🇼' },
  { code: 'es-ES', name: 'Spanish (Spain)', nativeName: 'Español (España)', flag: '🇪🇸' },
  { code: 'es-MX', name: 'Spanish (Mexico)', nativeName: 'Español (México)', flag: '🇲🇽' },
  { code: 'fr-FR', name: 'French (France)', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German (Germany)', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'pt-PT', name: 'Portuguese (Portugal)', nativeName: 'Português (Portugal)', flag: '🇵🇹' },
  { code: 'ar-SA', name: 'Arabic (Saudi Arabia)', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'ru-RU', name: 'Russian (Russia)', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'ko-KR', name: 'Korean (South Korea)', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'it-IT', name: 'Italian (Italy)', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'tr-TR', name: 'Turkish (Turkey)', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'ur-PK', name: 'Urdu (Pakistan)', nativeName: 'اردو', flag: '🇵🇰' },
  { code: 'ta-IN', name: 'Tamil (India)', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te-IN', name: 'Telugu (India)', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'bn-BD', name: 'Bengali (Bangladesh)', nativeName: 'বাংলা (বাংলাদেশ)', flag: '🇧🇩' },
  { code: 'bn-IN', name: 'Bengali (India)', nativeName: 'বাংলা (भारत)', flag: '🇮🇳' },
  { code: 'th-TH', name: 'Thai (Thailand)', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'vi-VN', name: 'Vietnamese (Vietnam)', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'id-ID', name: 'Indonesian (Indonesia)', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms-MY', name: 'Malay (Malaysia)', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'nl-NL', name: 'Dutch (Netherlands)', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl-PL', name: 'Polish (Poland)', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'sv-SE', name: 'Swedish (Sweden)', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'no-NO', name: 'Norwegian (Norway)', nativeName: 'Norsk', flag: '🇳🇴' },
  { code: 'da-DK', name: 'Danish (Denmark)', nativeName: 'Dansk', flag: '🇩🇰' },
  { code: 'fi-FI', name: 'Finnish (Finland)', nativeName: 'Suomi', flag: '🇫🇮' },
  { code: 'el-GR', name: 'Greek (Greece)', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'he-IL', name: 'Hebrew (Israel)', nativeName: 'עברית', flag: '🇮🇱' },
  { code: 'hu-HU', name: 'Hungarian (Hungary)', nativeName: 'Magyar', flag: '🇭🇺' },
  { code: 'cs-CZ', name: 'Czech (Czechia)', nativeName: 'Čeština', flag: '🇨🇿' },
  { code: 'ro-RO', name: 'Romanian (Romania)', nativeName: 'Română', flag: '🇷🇴' },
  { code: 'uk-UA', name: 'Ukrainian (Ukraine)', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'sk-SK', name: 'Slovak (Slovakia)', nativeName: 'Slovenčina', flag: '🇸🇰' },
  { code: 'ca-ES', name: 'Catalan (Spain)', nativeName: 'Català', flag: '🇪🇸' },
  { code: 'hr-HR', name: 'Croatian (Croatia)', nativeName: 'Hrvatski', flag: '🇭🇷' },
  { code: 'sr-RS', name: 'Serbian (Serbia)', nativeName: 'Српски', flag: '🇷🇸' },
  { code: 'bg-BG', name: 'Bulgarian (Bulgaria)', nativeName: 'Български', flag: '🇧🇬' },
  { code: 'mr-IN', name: 'Marathi (India)', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'gu-IN', name: 'Gujarati (India)', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'kn-IN', name: 'Kannada (India)', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml-IN', name: 'Malayalam (India)', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'pa-IN', name: 'Punjabi (India)', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'fa-IR', name: 'Persian (Iran)', nativeName: 'فارسی', flag: '🇮🇷' },
  { code: 'sw-KE', name: 'Swahili (Kenya)', nativeName: 'Kiswahili', flag: '🇰🇪' },
  { code: 'fil-PH', name: 'Filipino (Philippines)', nativeName: 'Tagalog', flag: '🇵🇭' },
];

/**
 * Fast language detection heuristic for real-time stream scripts
 */
export function detectLanguageFromText(text: string): DictationLanguage | null {
  if (!text || text.trim().length < 3) return null;

  // Devanagari script (Nepali / Hindi / Marathi)
  if (/[\u0900-\u097F]/.test(text)) {
    // Check for specific Nepali words
    if (/\b(छा|छन्|हो|गरेर|नमस्ते|तपाईं|नेपाल)\b/.test(text)) {
      return SUPPORTED_DICTATION_LANGUAGES.find((l) => l.code === 'ne-NP') || null;
    }
    return SUPPORTED_DICTATION_LANGUAGES.find((l) => l.code === 'hi-IN') || null;
  }

  // Japanese (Hiragana / Katakana / Kanji)
  if (/[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF]/.test(text)) {
    return SUPPORTED_DICTATION_LANGUAGES.find((l) => l.code === 'ja-JP') || null;
  }

  // Chinese
  if (/[\u4e00-\u9fa5]/.test(text)) {
    return SUPPORTED_DICTATION_LANGUAGES.find((l) => l.code === 'zh-CN') || null;
  }

  // Korean
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(text)) {
    return SUPPORTED_DICTATION_LANGUAGES.find((l) => l.code === 'ko-KR') || null;
  }

  // Arabic / Urdu
  if (/[\u0600-\u06FF]/.test(text)) {
    return SUPPORTED_DICTATION_LANGUAGES.find((l) => l.code === 'ar-SA') || null;
  }

  // Cyrillic (Russian / Ukrainian)
  if (/[\u0400-\u04FF]/.test(text)) {
    return SUPPORTED_DICTATION_LANGUAGES.find((l) => l.code === 'ru-RU') || null;
  }

  // Thai
  if (/[\u0E00-\u0E7F]/.test(text)) {
    return SUPPORTED_DICTATION_LANGUAGES.find((l) => l.code === 'th-TH') || null;
  }

  // Bengali
  if (/[\u0980-\u09FF]/.test(text)) {
    return SUPPORTED_DICTATION_LANGUAGES.find((l) => l.code === 'bn-BD') || null;
  }

  return null;
}
