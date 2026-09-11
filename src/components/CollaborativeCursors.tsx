import React, { useEffect, useState, useRef } from 'react';
import { UserPresence } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface CollaborativeCursorsProps {
  content: string;
  activeUsers: UserPresence[];
  typingUsers: Record<string, boolean>;
  myUid: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  editorFont: string;
  editorSize: number;
  isReadOnly: boolean;
}

interface CursorCoordinate {
  uid: string;
  name: string;
  color: string;
  isTyping: boolean;
  top: number;
  left: number;
  isVisible: boolean;
  selectionRect?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export default function CollaborativeCursors({
  content,
  activeUsers,
  typingUsers,
  myUid,
  textareaRef,
  editorFont,
  editorSize,
  isReadOnly
}: CollaborativeCursorsProps) {
  const [coords, setCoords] = useState<Record<string, CursorCoordinate>>({});

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Check if any remote users have active cursors to measure
    const remoteUsersWithCursors = activeUsers.filter(u => u.uid !== myUid && u.cursorIndex !== undefined);
    if (remoteUsersWithCursors.length === 0) {
      setCoords({});
      return;
    }

    let mirrorDiv: HTMLDivElement | null = null;

    const getMirrorDiv = () => {
      if (!mirrorDiv) {
        mirrorDiv = document.createElement('div');
        mirrorDiv.style.position = 'absolute';
        mirrorDiv.style.visibility = 'hidden';
        mirrorDiv.style.pointerEvents = 'none';
        mirrorDiv.style.whiteSpace = 'pre-wrap';
        mirrorDiv.style.wordBreak = 'break-word';
        document.body.appendChild(mirrorDiv);
      }
      return mirrorDiv;
    };

    // Measures coordinates of standard caret index inside a textarea mirroring its style properties
    const calculateCaretCoordinates = (index: number) => {
      if (index === undefined || index === null) return null;
      
      const div = getMirrorDiv();
      const style = window.getComputedStyle(textarea);

      // Copy essential style properties
      div.style.width = textarea.clientWidth + 'px';
      div.style.fontFamily = style.fontFamily;
      div.style.fontSize = style.fontSize;
      div.style.lineHeight = style.lineHeight;
      div.style.paddingLeft = style.paddingLeft;
      div.style.paddingTop = style.paddingTop;
      div.style.paddingRight = style.paddingRight;
      div.style.paddingBottom = style.paddingBottom;
      div.style.border = style.border;
      div.style.boxSizing = style.boxSizing;

      // Extract text up to selection index and append helper mark block
      const val = textarea.value || '';
      const textIndex = Math.min(index, val.length);
      const textBefore = val.substring(0, textIndex);
      
      div.textContent = textBefore;
      const span = document.createElement('span');
      span.textContent = '|';
      div.appendChild(span);

      const top = span.offsetTop;
      const left = span.offsetLeft;

      return { top, left };
    };

    let rafId: number | null = null;

    const updateAllPositions = () => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const scrollTop = textarea.scrollTop;
      const scrollLeft = textarea.scrollLeft;
      const clientHeight = textarea.clientHeight;
      const clientWidth = textarea.clientWidth;

      const updatedCoords: Record<string, CursorCoordinate> = {};

      remoteUsersWithCursors.forEach((user) => {
        if (user.cursorIndex === undefined) return;

        const isCurrentlyTyping = !!typingUsers[user.uid];

        const caretOffsets = calculateCaretCoordinates(user.cursorIndex);
        if (caretOffsets) {
          const finalTop = caretOffsets.top - scrollTop;
          const finalLeft = caretOffsets.left - scrollLeft;

          const isVisible =
            finalTop >= 0 &&
            finalTop <= clientHeight - 12 &&
            finalLeft >= 0 &&
            finalLeft <= clientWidth - 5;

          let selectionRect = undefined;
          if (user.selectionEnd !== undefined && user.selectionEnd !== user.cursorIndex) {
            const endOffsets = calculateCaretCoordinates(user.selectionEnd);
            if (endOffsets) {
              const selLeft = Math.min(caretOffsets.left, endOffsets.left) - scrollLeft;
              const selTop = Math.min(caretOffsets.top, endOffsets.top) - scrollTop;
              const selWidth = Math.max(Math.abs(endOffsets.left - caretOffsets.left), 4);
              const selHeight = Math.max(Math.abs(endOffsets.top - caretOffsets.top) + 18, 18);
              selectionRect = {
                top: selTop,
                left: selLeft,
                width: selWidth,
                height: selHeight
              };
            }
          }

          updatedCoords[user.uid] = {
            uid: user.uid,
            name: user.name,
            color: user.color || '#0ea5e9',
            isTyping: isCurrentlyTyping,
            top: finalTop,
            left: finalLeft,
            isVisible,
            selectionRect
          };
        }
      });

      setCoords(updatedCoords);
    };

    const scheduleUpdate = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = null;
        updateAllPositions();
      });
    };

    // Calculate positions initially
    updateAllPositions();

    textarea.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });

    // Light interval for periodic updates
    const interval = setInterval(updateAllPositions, 300);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      textarea.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      clearInterval(interval);
      if (mirrorDiv && mirrorDiv.parentNode) {
        mirrorDiv.parentNode.removeChild(mirrorDiv);
      }
    };
  }, [content, activeUsers, typingUsers, myUid, textareaRef, editorFont, editorSize, isReadOnly]);

  if (isReadOnly) return null;

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-hidden rounded-xl">
      <AnimatePresence>
        {(Object.values(coords) as CursorCoordinate[]).map((cursor) => {
          if (!cursor.isVisible) return null;

          const firstLetter = cursor.name ? cursor.name.charAt(0).toUpperCase() : '?';

          return (
            <React.Fragment key={cursor.uid}>
              {/* Remote Selection Highlight Box */}
              {cursor.selectionRect && (
                <div
                  className="absolute pointer-events-none transition-all duration-75 rounded-xs"
                  style={{
                    top: `${cursor.selectionRect.top}px`,
                    left: `${cursor.selectionRect.left}px`,
                    width: `${cursor.selectionRect.width}px`,
                    height: `${cursor.selectionRect.height}px`,
                    backgroundColor: cursor.color,
                    opacity: 0.25,
                  }}
                />
              )}

              <div
                className="absolute transition-all duration-75 ease-out pointer-events-none"
                style={{
                  top: `${cursor.top}px`,
                  left: `${cursor.left}px`,
                }}
              >
              {/* Vertical blinking Caret stem line */}
              <div 
                className="w-[2px] h-[1.3em] relative"
                style={{ backgroundColor: cursor.color }}
              >
                {/* Visual pulse glow when typing */}
                {cursor.isTyping && (
                  <span 
                    className="absolute inset-0 animate-ping opacity-60 rounded-full"
                    style={{ backgroundColor: cursor.color }}
                  />
                )}
              </div>

              {/* Cursor Avatar or Name Pill label tag */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="absolute left-0 -top-7 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white shadow-md z-40 whitespace-nowrap"
                style={{ backgroundColor: cursor.color }}
              >
                {/* Avatar dot with initial letter */}
                <span className="w-3.5 h-3.5 flex items-center justify-center bg-white/25 rounded-full text-[8px] font-black leading-none uppercase">
                  {firstLetter}
                </span>

                {/* Nickname wordmark */}
                <span>{cursor.name}</span>

                {/* Animated Typing sub-indicator */}
                {cursor.isTyping && (
                  <span className="flex items-center gap-[1.5px] ml-0.5 mt-0.5">
                    <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                )}

                {/* Drop pointer notch arrow underneath the bubble */}
                <svg
                  className="absolute left-1 top-full w-2.5 h-1.5 text-current fill-current -mt-[1px]"
                  viewBox="0 0 10 5"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M 0,0 L 5,5 L 10,0 Z" />
                </svg>
              </motion.div>
              </div>
            </React.Fragment>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
