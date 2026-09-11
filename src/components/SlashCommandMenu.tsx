import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Heading1,
  Heading2,
  Heading3,
  Type,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Table,
  Code,
  Minus,
  Info,
  Image as ImageIcon,
  Link as LinkIcon
} from 'lucide-react';

export interface SlashCommand {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  snippet: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  { id: 'h1', title: 'Heading 1', description: 'Large section heading', icon: Heading1, snippet: '# ' },
  { id: 'h2', title: 'Heading 2', description: 'Medium section heading', icon: Heading2, snippet: '## ' },
  { id: 'h3', title: 'Heading 3', description: 'Small section heading', icon: Heading3, snippet: '### ' },
  { id: 'text', title: 'Text / Paragraph', description: 'Plain body text block', icon: Type, snippet: '' },
  { id: 'bullet', title: 'Bullet List', description: 'Create a simple bulleted list', icon: List, snippet: '- ' },
  { id: 'numbered', title: 'Numbered List', description: 'Create a numbered list', icon: ListOrdered, snippet: '1. ' },
  { id: 'checklist', title: 'Checklist / To-Do', description: 'Track tasks with checkboxes', icon: ListChecks, snippet: '- [ ] ' },
  { id: 'quote', title: 'Block Quote', description: 'Highlight a quotation or excerpt', icon: Quote, snippet: '> ' },
  { id: 'callout', title: 'Callout Box', description: 'Emphasize key tips or notices', icon: Info, snippet: '> 💡 ' },
  { id: 'table', title: 'Table', description: 'Insert a 2x2 data grid table', icon: Table, snippet: '| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |' },
  { id: 'codeblock', title: 'Code Block', description: 'Format syntax highlighted code snippet', icon: Code, snippet: '```javascript\n// write code here\n```' },
  { id: 'divider', title: 'Horizontal Divider', description: 'Visually divide document sections', icon: Minus, snippet: '---\n' },
  { id: 'image', title: 'Image Placeholder', description: 'Embed image URL preview', icon: ImageIcon, snippet: '![Image description](https://picsum.photos/800/400)' },
  { id: 'link', title: 'Hyperlink', description: 'Add clickable web URL link', icon: LinkIcon, snippet: '[Link title](https://example.com)' },
];

interface SlashCommandMenuProps {
  query: string;
  selectedIndex: number;
  position: { top: number; left: number } | null;
  onSelectCommand: (command: SlashCommand) => void;
  onClose: () => void;
}

export default function SlashCommandMenu({
  query,
  selectedIndex,
  position,
  onSelectCommand,
  onClose
}: SlashCommandMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = SLASH_COMMANDS.filter(cmd =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.description.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const activeItem = menuRef.current?.children[selectedIndex] as HTMLElement;
    if (activeItem) {
      activeItem.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!position || filtered.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -5 }}
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 100,
      }}
      className="w-64 max-h-72 overflow-y-auto bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-zinc-800 shadow-2xl rounded-2xl p-1.5 select-none"
    >
      <div className="px-2 py-1 text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 border-b border-slate-100 dark:border-zinc-800/60 mb-1 flex items-center justify-between">
        <span>Insert Block</span>
        <span className="font-mono text-[8px] bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded">↑↓ to navigate</span>
      </div>

      <div ref={menuRef} className="flex flex-col gap-0.5">
        {filtered.map((cmd, idx) => {
          const Icon = cmd.icon;
          const isSelected = idx === selectedIndex;
          return (
            <button
              key={cmd.id}
              type="button"
              onClick={() => onSelectCommand(cmd)}
              className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-cyan-500/15 text-[#0ea5e9] dark:bg-cyan-500/20 dark:text-cyan-400 font-semibold'
                  : 'hover:bg-slate-100/80 dark:hover:bg-zinc-800/60 text-slate-700 dark:text-zinc-200'
              }`}
            >
              <div className={`p-1.5 rounded-lg shrink-0 ${
                isSelected ? 'bg-cyan-500 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
              }`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold leading-tight truncate">{cmd.title}</span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">{cmd.description}</span>
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
