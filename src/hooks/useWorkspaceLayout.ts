import { useState, useEffect, useCallback, useRef, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';

export type LeftSidebarMode = 'expanded' | 'collapsed' | 'hidden';
export type RightTab = 'info' | 'attachments' | 'chat' | 'participants' | 'outline';

export interface WorkspaceLayoutConfig {
  leftWidth: number;
  rightWidth: number;
  bottomHeight: number;
  leftMode: LeftSidebarMode;
  rightOpen: boolean;
  bottomOpen: boolean;
  activeRightTab: RightTab;
}

const STORAGE_KEY = 'livepad_workspace_layout_v2';

const DEFAULT_CONFIG: WorkspaceLayoutConfig = {
  leftWidth: 260,
  rightWidth: 320,
  bottomHeight: 180,
  leftMode: 'expanded',
  rightOpen: true,
  bottomOpen: false,
  activeRightTab: 'info',
};

export function useWorkspaceLayout() {
  const [config, setConfig] = useState<WorkspaceLayoutConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          leftWidth: Math.min(Math.max(parsed.leftWidth || 260, 200), 450),
          rightWidth: Math.min(Math.max(parsed.rightWidth || 320, 250), 520),
          bottomHeight: Math.min(Math.max(parsed.bottomHeight || 180, 120), 400),
        };
      }
    } catch (_) {
      // Fallback to default config on error
    }
    return DEFAULT_CONFIG;
  });

  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<'left' | 'right' | 'bottom' | null>(null);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (_) {}
  }, [config]);

  // Setters
  const setLeftWidth = useCallback((width: number) => {
    const clamped = Math.min(Math.max(width, 200), 450);
    setConfig((prev) => ({ ...prev, leftWidth: clamped }));
  }, []);

  const setRightWidth = useCallback((width: number) => {
    const maxConstraint = typeof window !== 'undefined' ? Math.min(520, Math.floor(window.innerWidth * 0.45)) : 520;
    const minConstraint = 250;
    const clamped = Math.min(Math.max(width, minConstraint), Math.max(minConstraint, maxConstraint));
    setConfig((prev) => ({ ...prev, rightWidth: clamped }));
  }, []);

  const setBottomHeight = useCallback((height: number) => {
    const clamped = Math.min(Math.max(height, 120), 400);
    setConfig((prev) => ({ ...prev, bottomHeight: clamped }));
  }, []);

  const setLeftMode = useCallback((mode: LeftSidebarMode) => {
    setConfig((prev) => ({ ...prev, leftMode: mode }));
  }, []);

  const toggleLeftSidebar = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      leftMode: prev.leftMode === 'expanded' ? 'hidden' : 'expanded',
    }));
  }, []);

  const setRightOpen = useCallback((open: boolean) => {
    setConfig((prev) => ({ ...prev, rightOpen: open }));
  }, []);

  const toggleRightSidebar = useCallback(() => {
    setConfig((prev) => ({ ...prev, rightOpen: !prev.rightOpen }));
  }, []);

  const toggleBottomPanel = useCallback(() => {
    setConfig((prev) => ({ ...prev, bottomOpen: !prev.bottomOpen }));
  }, []);

  const setActiveRightTab = useCallback((tab: RightTab) => {
    setConfig((prev) => ({ ...prev, activeRightTab: tab, rightOpen: true }));
  }, []);

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode((prev) => !prev);
  }, []);

  // Mouse drag handlers for resizing
  const dragRef = useRef<{ startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);

  const startLeftResize = useCallback((e: ReactMouseEvent | ReactTouchEvent) => {
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    dragRef.current = { startX: clientX, startY: 0, startWidth: config.leftWidth, startHeight: 0 };
    setIsResizing('left');
  }, [config.leftWidth]);

  const startRightResize = useCallback((e: ReactMouseEvent | ReactTouchEvent) => {
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    dragRef.current = { startX: clientX, startY: 0, startWidth: config.rightWidth, startHeight: 0 };
    setIsResizing('right');
  }, [config.rightWidth]);

  const startBottomResize = useCallback((e: ReactMouseEvent | ReactTouchEvent) => {
    e.preventDefault();
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragRef.current = { startX: 0, startY: clientY, startWidth: 0, startHeight: config.bottomHeight };
    setIsResizing('bottom');
  }, [config.bottomHeight]);

  // Global mousemove / mouseup during resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!dragRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      if (isResizing === 'left') {
        const delta = clientX - dragRef.current.startX;
        setLeftWidth(dragRef.current.startWidth + delta);
      } else if (isResizing === 'right') {
        const delta = dragRef.current.startX - clientX;
        setRightWidth(dragRef.current.startWidth + delta);
      } else if (isResizing === 'bottom') {
        const delta = dragRef.current.startY - clientY;
        setBottomHeight(dragRef.current.startHeight + delta);
      }
    };

    const handleEnd = () => {
      setIsResizing(null);
      dragRef.current = null;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isResizing, setLeftWidth, setRightWidth, setBottomHeight]);

  // Keyboard shortcut listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      // Focus Mode toggle: Ctrl+\ or Alt+F (works even in editor if Alt+F or Ctrl+\)
      if ((e.ctrlKey && e.key === '\\') || (e.altKey && e.key.toLowerCase() === 'f')) {
        e.preventDefault();
        toggleFocusMode();
        return;
      }

      // Exit focus mode on Escape
      if (e.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false);
        return;
      }

      if (isInput) return;

      // Ctrl+B / Cmd+B: Left Sidebar Toggle
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleLeftSidebar();
      }

      // Ctrl+. / Cmd+.: Right Inspector Panel Toggle
      if ((e.ctrlKey || e.metaKey) && e.key === '.') {
        e.preventDefault();
        toggleRightSidebar();
      }

      // Ctrl+Shift+B / Cmd+Shift+B: Right Sidebar Toggle
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleRightSidebar();
      }

      // Ctrl+J / Cmd+J: Bottom Panel Toggle
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        toggleBottomPanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode, toggleLeftSidebar, toggleRightSidebar, toggleBottomPanel, toggleFocusMode]);

  return {
    ...config,
    isFocusMode,
    isResizing,
    setLeftWidth,
    setRightWidth,
    setBottomHeight,
    setLeftMode,
    setRightOpen,
    toggleLeftSidebar,
    toggleRightSidebar,
    toggleBottomPanel,
    setActiveRightTab,
    toggleFocusMode,
    setIsFocusMode,
    startLeftResize,
    startRightResize,
    startBottomResize,
  };
}
