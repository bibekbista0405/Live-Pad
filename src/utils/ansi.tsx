import React from 'react';

const ANSI_COLOR_MAP: Record<number, string> = {
  30: 'text-gray-900',
  31: 'text-red-400 font-semibold',
  32: 'text-emerald-400 font-semibold',
  33: 'text-amber-300 font-semibold',
  34: 'text-blue-400 font-semibold',
  35: 'text-purple-400 font-semibold',
  36: 'text-cyan-400 font-semibold',
  37: 'text-slate-200',
  90: 'text-slate-500',
  91: 'text-red-300',
  92: 'text-green-300',
  93: 'text-yellow-200',
  94: 'text-blue-300',
  95: 'text-purple-300',
  96: 'text-cyan-300',
  97: 'text-white'
};

const ANSI_BG_MAP: Record<number, string> = {
  40: 'bg-black',
  41: 'bg-red-900/60',
  42: 'bg-emerald-900/60',
  43: 'bg-amber-900/60',
  44: 'bg-blue-900/60',
  45: 'bg-purple-900/60',
  46: 'bg-cyan-900/60',
  47: 'bg-slate-700'
};

export function renderAnsiText(text: string): React.ReactNode {
  if (!text) return null;

  // Regex to split string by ANSI escape codes like \x1b[31m or \u001b[0m
  const ansiRegex = /(\u001b|\x1b)\[[0-9;]*m/g;
  const parts = text.split(ansiRegex);
  const matches = text.match(ansiRegex);

  if (!matches || matches.length === 0) {
    return text;
  }

  const elements: React.ReactNode[] = [];
  let currentClasses: string[] = [];
  let elementKey = 0;

  // Interleave text chunks and ANSI code matches
  let textIdx = 0;
  for (let i = 0; i < text.length; ) {
    const match = ansiRegex.exec(text);
    if (!match) {
      const remaining = text.substring(i);
      if (remaining) {
        elements.push(
          <span key={elementKey++} className={currentClasses.join(' ')}>
            {remaining}
          </span>
        );
      }
      break;
    }

    const matchStart = match.index;
    if (matchStart > i) {
      const chunk = text.substring(i, matchStart);
      elements.push(
        <span key={elementKey++} className={currentClasses.join(' ')}>
          {chunk}
        </span>
      );
    }

    // Process ANSI sequence
    const seq = match[0];
    const codes = seq
      .replace(/(\u001b|\x1b)\[/, '')
      .replace('m', '')
      .split(';')
      .map((c) => parseInt(c, 10))
      .filter((n) => !isNaN(n));

    if (codes.length === 0 || codes.includes(0)) {
      currentClasses = [];
    }

    codes.forEach((code) => {
      if (code === 1) currentClasses.push('font-bold');
      else if (code === 3) currentClasses.push('italic');
      else if (code === 4) currentClasses.push('underline');
      else if (ANSI_COLOR_MAP[code]) {
        // remove old text colors
        currentClasses = currentClasses.filter((cls) => !cls.startsWith('text-'));
        currentClasses.push(ANSI_COLOR_MAP[code]);
      } else if (ANSI_BG_MAP[code]) {
        currentClasses = currentClasses.filter((cls) => !cls.startsWith('bg-'));
        currentClasses.push(ANSI_BG_MAP[code]);
      }
    });

    i = matchStart + match[0].length;
  }

  return <>{elements}</>;
}
