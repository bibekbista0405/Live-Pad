export interface EmojiItem {
  emoji: string;
  name: string;
  shortcode: string;
  keywords: string[];
  category: 'emotions' | 'gestures' | 'objects' | 'symbols' | 'nature' | 'food';
}

export const EMOJI_LIST: EmojiItem[] = [
  // Emotions & Faces
  { emoji: '😀', name: 'Grinning Face', shortcode: 'smile', keywords: ['smile', 'happy', 'face', 'grinning'], category: 'emotions' },
  { emoji: '😂', name: 'Face with Tears of Joy', shortcode: 'joy', keywords: ['joy', 'laugh', 'lol', 'tears', 'happy'], category: 'emotions' },
  { emoji: '🤣', name: 'Rolling on the Floor Laughing', shortcode: 'rofl', keywords: ['rofl', 'laughing', 'lol', 'funny'], category: 'emotions' },
  { emoji: '😊', name: 'Smiling Face with Smiling Eyes', shortcode: 'blush', keywords: ['blush', 'happy', 'smile', 'sweet'], category: 'emotions' },
  { emoji: '😍', name: 'Heart Eyes', shortcode: 'heart_eyes', keywords: ['heart_eyes', 'love', 'heart', 'adore', 'cute'], category: 'emotions' },
  { emoji: '🥰', name: 'Smiling Face with Hearts', shortcode: 'loving', keywords: ['loving', 'love', 'hearts', 'affection'], category: 'emotions' },
  { emoji: '😎', name: 'Cool Face', shortcode: 'cool', keywords: ['cool', 'sunglasses', 'awesome', 'style'], category: 'emotions' },
  { emoji: '🥳', name: 'Partying Face', shortcode: 'party', keywords: ['party', 'celebrate', 'tada', 'birthday', 'fun'], category: 'emotions' },
  { emoji: '🤔', name: 'Thinking Face', shortcode: 'thinking', keywords: ['thinking', 'think', 'hmm', 'wonder', 'curious'], category: 'emotions' },
  { emoji: '😅', name: 'Grinning Face with Sweat', shortcode: 'sweat_smile', keywords: ['sweat_smile', 'sweat', 'whew', 'relief'], category: 'emotions' },
  { emoji: '😭', name: 'Loudly Crying Face', shortcode: 'sob', keywords: ['sob', 'cry', 'sad', 'tears', 'unhappy'], category: 'emotions' },
  { emoji: '😱', name: 'Face Screaming in Fear', shortcode: 'scream', keywords: ['scream', 'shocked', 'omg', 'fear', 'wow'], category: 'emotions' },
  { emoji: '😜', name: 'Winking Face with Tongue', shortcode: 'wink', keywords: ['wink', 'tongue', 'playful', 'silly'], category: 'emotions' },
  { emoji: '🙄', name: 'Face with Rolling Eyes', shortcode: 'roll_eyes', keywords: ['roll_eyes', 'whatever', 'bored', 'annoyed'], category: 'emotions' },
  { emoji: '😬', name: 'Grimacing Face', shortcode: 'grimacing', keywords: ['grimacing', 'yikes', 'awkward', 'oops'], category: 'emotions' },
  { emoji: '😴', name: 'Sleeping Face', shortcode: 'sleep', keywords: ['sleep', 'zzz', 'tired', 'night'], category: 'emotions' },
  { emoji: '🤩', name: 'Star-Struck', shortcode: 'star_struck', keywords: ['star_struck', 'star', 'wow', 'excited'], category: 'emotions' },
  { emoji: '😇', name: 'Smiling Face with Halo', shortcode: 'angel', keywords: ['angel', 'halo', 'innocent', 'good'], category: 'emotions' },
  { emoji: '🤯', name: 'Exploding Head', shortcode: 'mindblown', keywords: ['mindblown', 'boom', 'exploding', 'wow'], category: 'emotions' },
  { emoji: '💩', name: 'Pile of Poop', shortcode: 'poop', keywords: ['poop', 'pooper', 'funny'], category: 'emotions' },

  // Gestures
  { emoji: '👍', name: 'Thumbs Up', shortcode: 'thumbsup', keywords: ['thumbsup', 'like', 'yes', 'approve', '+1', 'good'], category: 'gestures' },
  { emoji: '👎', name: 'Thumbs Down', shortcode: 'thumbsdown', keywords: ['thumbsdown', 'dislike', 'no', '-1', 'bad'], category: 'gestures' },
  { emoji: '👏', name: 'Clapping Hands', shortcode: 'clap', keywords: ['clap', 'applause', 'bravo', 'congrats'], category: 'gestures' },
  { emoji: '🙌', name: 'Raising Hands', shortcode: 'hooray', keywords: ['hooray', 'celebration', 'praise', 'yay'], category: 'gestures' },
  { emoji: '🤝', name: 'Handshake', shortcode: 'handshake', keywords: ['handshake', 'deal', 'agree', 'partner'], category: 'gestures' },
  { emoji: '🙏', name: 'Folded Hands', shortcode: 'pray', keywords: ['pray', 'please', 'thanks', 'thankyou', 'hope'], category: 'gestures' },
  { emoji: '👋', name: 'Waving Hand', shortcode: 'wave', keywords: ['wave', 'hello', 'hi', 'bye', 'goodbye'], category: 'gestures' },
  { emoji: '💪', name: 'Flexed Biceps', shortcode: 'muscle', keywords: ['muscle', 'flex', 'strong', 'power', 'fitness'], category: 'gestures' },
  { emoji: '✌️', name: 'Victory Hand', shortcode: 'peace', keywords: ['peace', 'victory', 'two'], category: 'gestures' },
  { emoji: '🔥', name: 'Fire', shortcode: 'fire', keywords: ['fire', 'hot', 'flame', 'lit', 'popular', 'trend'], category: 'symbols' },

  // Objects & Tech
  { emoji: '🚀', name: 'Rocket', shortcode: 'rocket', keywords: ['rocket', 'launch', 'ship', 'fast', 'startup'], category: 'objects' },
  { emoji: '🎉', name: 'Party Popper', shortcode: 'tada', keywords: ['tada', 'party', 'celebration', 'congrats'], category: 'objects' },
  { emoji: '💡', name: 'Light Bulb', shortcode: 'bulb', keywords: ['bulb', 'idea', 'light', 'bright', 'think'], category: 'objects' },
  { emoji: '⚡', name: 'High Voltage', shortcode: 'zap', keywords: ['zap', 'lightning', 'bolt', 'fast', 'power', 'energy'], category: 'symbols' },
  { emoji: '📌', name: 'Pushpin', shortcode: 'pin', keywords: ['pin', 'pushpin', 'note', 'save', 'tack'], category: 'objects' },
  { emoji: '📝', name: 'Memo', shortcode: 'memo', keywords: ['memo', 'pencil', 'write', 'note', 'document', 'paper'], category: 'objects' },
  { emoji: '📚', name: 'Books', shortcode: 'books', keywords: ['books', 'study', 'read', 'library', 'education'], category: 'objects' },
  { emoji: '💻', name: 'Laptop', shortcode: 'laptop', keywords: ['laptop', 'computer', 'code', 'tech', 'work'], category: 'objects' },
  { emoji: '🎨', name: 'Artist Palette', shortcode: 'art', keywords: ['art', 'palette', 'design', 'color', 'paint'], category: 'objects' },
  { emoji: '🎵', name: 'Musical Note', shortcode: 'music', keywords: ['music', 'note', 'song', 'audio'], category: 'objects' },
  { emoji: '🏆', name: 'Trophy', shortcode: 'trophy', keywords: ['trophy', 'winner', 'award', 'gold', 'first'], category: 'objects' },
  { emoji: '🎯', name: 'Direct Hit', shortcode: 'target', keywords: ['target', 'bullseye', 'goal', 'hit', 'aim'], category: 'objects' },
  { emoji: '🔒', name: 'Locked', shortcode: 'lock', keywords: ['lock', 'secure', 'private', 'password'], category: 'objects' },
  { emoji: '🔓', name: 'Unlocked', shortcode: 'unlock', keywords: ['unlock', 'open', 'access'], category: 'objects' },
  { emoji: '🔑', name: 'Key', shortcode: 'key', keywords: ['key', 'access', 'password', 'secret'], category: 'objects' },
  { emoji: '🔔', name: 'Bell', shortcode: 'bell', keywords: ['bell', 'notification', 'alert', 'ring'], category: 'objects' },
  { emoji: '🎁', name: 'Wrapped Gift', shortcode: 'gift', keywords: ['gift', 'present', 'box', 'surprise'], category: 'objects' },
  { emoji: '📅', name: 'Calendar', shortcode: 'calendar', keywords: ['calendar', 'date', 'schedule', 'event'], category: 'objects' },
  { emoji: '⏰', name: 'Alarm Clock', shortcode: 'clock', keywords: ['clock', 'time', 'alarm', 'timer'], category: 'objects' },

  // Symbols & Status
  { emoji: '✨', name: 'Sparkles', shortcode: 'sparkles', keywords: ['sparkles', 'magic', 'star', 'clean', 'ai', 'new'], category: 'symbols' },
  { emoji: '⭐', name: 'Star', shortcode: 'star', keywords: ['star', 'favorite', 'gold', 'rating'], category: 'symbols' },
  { emoji: '❤️', name: 'Red Heart', shortcode: 'heart', keywords: ['heart', 'red_heart', 'love', 'like'], category: 'symbols' },
  { emoji: '💖', name: 'Sparkling Heart', shortcode: 'sparkling_heart', keywords: ['sparkling_heart', 'love', 'pink'], category: 'symbols' },
  { emoji: '💯', name: 'Hundred Points', shortcode: '100', keywords: ['100', 'hundred', 'perfect', 'score', 'full'], category: 'symbols' },
  { emoji: '✅', name: 'Check Mark', shortcode: 'check', keywords: ['check', 'done', 'yes', 'success', 'approved', 'true'], category: 'symbols' },
  { emoji: '❌', name: 'Cross Mark', shortcode: 'cross', keywords: ['cross', 'no', 'wrong', 'delete', 'cancel', 'false'], category: 'symbols' },
  { emoji: '⚠️', name: 'Warning', shortcode: 'warning', keywords: ['warning', 'alert', 'caution', 'danger'], category: 'symbols' },
  { emoji: '💬', name: 'Speech Balloon', shortcode: 'chat', keywords: ['chat', 'speech', 'comment', 'message'], category: 'symbols' },
  { emoji: '📢', name: 'Loudspeaker', shortcode: 'announcement', keywords: ['announcement', 'loudspeaker', 'news', 'broadcast'], category: 'symbols' },
  { emoji: '💰', name: 'Money Bag', shortcode: 'money', keywords: ['money', 'cash', 'dollar', 'wealth', 'pay'], category: 'symbols' },

  // Nature & Food
  { emoji: '☕', name: 'Hot Beverage', shortcode: 'coffee', keywords: ['coffee', 'drink', 'tea', 'cafe', 'morning'], category: 'food' },
  { emoji: '🍕', name: 'Pizza', shortcode: 'pizza', keywords: ['pizza', 'food', 'slice', 'dinner'], category: 'food' },
  { emoji: '🍔', name: 'Hamburger', shortcode: 'burger', keywords: ['burger', 'food', 'hamburger', 'lunch'], category: 'food' },
  { emoji: '🐶', name: 'Dog Face', shortcode: 'dog', keywords: ['dog', 'puppy', 'pet', 'animal'], category: 'nature' },
  { emoji: '🐱', name: 'Cat Face', shortcode: 'cat', keywords: ['cat', 'kitten', 'pet', 'animal'], category: 'nature' },
  { emoji: '🌍', name: 'Globe Europe-Africa', shortcode: 'earth', keywords: ['earth', 'globe', 'world', 'planet'], category: 'nature' },
  { emoji: '☀️', name: 'Sun', shortcode: 'sun', keywords: ['sun', 'sunny', 'weather', 'bright', 'day'], category: 'nature' },
  { emoji: '🌙', name: 'Crescent Moon', shortcode: 'moon', keywords: ['moon', 'night', 'dark', 'sleep'], category: 'nature' },
  { emoji: '🌈', name: 'Rainbow', shortcode: 'rainbow', keywords: ['rainbow', 'pride', 'colors', 'sky'], category: 'nature' },
  { emoji: '🤖', name: 'Robot', shortcode: 'bot', keywords: ['bot', 'robot', 'ai', 'tech'], category: 'objects' },
  { emoji: '👀', name: 'Eyes', shortcode: 'eyes', keywords: ['eyes', 'look', 'see', 'peek'], category: 'emotions' },
];

export function searchEmojis(query: string): EmojiItem[] {
  const clean = query.trim().toLowerCase().replace(/^:/, '');
  if (!clean) return EMOJI_LIST.slice(0, 24);

  return EMOJI_LIST.filter((item) => {
    if (item.shortcode.toLowerCase().includes(clean)) return true;
    if (item.name.toLowerCase().includes(clean)) return true;
    return item.keywords.some((k) => k.toLowerCase().includes(clean));
  }).slice(0, 20);
}
