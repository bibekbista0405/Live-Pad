import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import type { Theme } from '../types';
import type { WorkspaceCategory } from '../utils/workspaceCategories';

export type NotepadViewMode = 'active' | 'workspaces' | 'trash';

export interface AppUIState {
  theme: Theme;
  workspaceCategory: WorkspaceCategory;
  notepadViewMode: NotepadViewMode;
  sidebarOpen: boolean;
  leftSidebarOpen: boolean;
  isCodeMode: boolean;
  isFullscreen: boolean;
  commandPaletteOpen: boolean;
  searchOpen: boolean;
  searchQuery: string;
  activeMatchIndex: number;
}

type AppUIAction =
  | { type: 'setTheme'; value: Theme }
  | { type: 'setWorkspaceCategory'; value: WorkspaceCategory }
  | { type: 'setNotepadViewMode'; value: NotepadViewMode }
  | { type: 'setSidebarOpen'; value: boolean }
  | { type: 'setLeftSidebarOpen'; value: boolean }
  | { type: 'setCodeMode'; value: boolean }
  | { type: 'setFullscreen'; value: boolean }
  | { type: 'setCommandPaletteOpen'; value: boolean }
  | { type: 'setSearchOpen'; value: boolean }
  | { type: 'setSearchQuery'; value: string }
  | { type: 'setActiveMatchIndex'; value: number }
  | { type: 'resetSearch' };

export const initialAppUIState: AppUIState = {
  theme: 'light',
  workspaceCategory: 'team',
  notepadViewMode: 'active',
  sidebarOpen: true,
  leftSidebarOpen: typeof window === 'undefined' ? true : window.innerWidth >= 1024,
  isCodeMode: false,
  isFullscreen: false,
  commandPaletteOpen: false,
  searchOpen: false,
  searchQuery: '',
  activeMatchIndex: 0,
};

export function appUIReducer(state: AppUIState, action: AppUIAction): AppUIState {
  switch (action.type) {
    case 'setTheme':
      return { ...state, theme: action.value };
    case 'setWorkspaceCategory':
      return { ...state, workspaceCategory: action.value };
    case 'setNotepadViewMode':
      return { ...state, notepadViewMode: action.value };
    case 'setSidebarOpen':
      return { ...state, sidebarOpen: action.value };
    case 'setLeftSidebarOpen':
      return { ...state, leftSidebarOpen: action.value };
    case 'setCodeMode':
      return { ...state, isCodeMode: action.value };
    case 'setFullscreen':
      return { ...state, isFullscreen: action.value };
    case 'setCommandPaletteOpen':
      return { ...state, commandPaletteOpen: action.value };
    case 'setSearchOpen':
      return { ...state, searchOpen: action.value };
    case 'setSearchQuery':
      return { ...state, searchQuery: action.value };
    case 'setActiveMatchIndex':
      return { ...state, activeMatchIndex: action.value };
    case 'resetSearch':
      return { ...state, searchOpen: false, searchQuery: '', activeMatchIndex: 0 };
    default:
      return state;
  }
}

interface AppUIContextValue extends AppUIState {
  dispatch: Dispatch<AppUIAction>;
  setTheme: (value: SetStateAction<Theme>) => void;
  setWorkspaceCategory: (value: SetStateAction<WorkspaceCategory>) => void;
  setNotepadViewMode: (value: SetStateAction<NotepadViewMode>) => void;
  setSidebarOpen: (value: SetStateAction<boolean>) => void;
  setLeftSidebarOpen: (value: SetStateAction<boolean>) => void;
  setIsCodeMode: (value: SetStateAction<boolean>) => void;
  setIsFullscreen: (value: SetStateAction<boolean>) => void;
  setCommandPaletteOpen: (value: SetStateAction<boolean>) => void;
  setSearchOpen: (value: SetStateAction<boolean>) => void;
  setSearchQuery: (value: SetStateAction<string>) => void;
  setActiveMatchIndex: (value: SetStateAction<number>) => void;
  resetSearch: () => void;
}

const AppUIContext = createContext<AppUIContextValue | null>(null);

function resolveSetter<T>(value: SetStateAction<T>, current: T): T {
  return typeof value === 'function'
    ? (value as (previous: T) => T)(current)
    : value;
}

function readInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return (localStorage.getItem('livepad_theme') as Theme) || 'light';
}

export function AppUIProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appUIReducer, {
    ...initialAppUIState,
    theme: readInitialTheme(),
  });

  const setTheme = useCallback((value: SetStateAction<Theme>) => {
    dispatch({ type: 'setTheme', value: resolveSetter(value, state.theme) });
  }, [state.theme]);

  const setWorkspaceCategory = useCallback((value: SetStateAction<WorkspaceCategory>) => {
    dispatch({ type: 'setWorkspaceCategory', value: resolveSetter(value, state.workspaceCategory) });
  }, [state.workspaceCategory]);

  const setNotepadViewMode = useCallback((value: SetStateAction<NotepadViewMode>) => {
    dispatch({ type: 'setNotepadViewMode', value: resolveSetter(value, state.notepadViewMode) });
  }, [state.notepadViewMode]);

  const setSidebarOpen = useCallback((value: SetStateAction<boolean>) => {
    dispatch({ type: 'setSidebarOpen', value: resolveSetter(value, state.sidebarOpen) });
  }, [state.sidebarOpen]);

  const setLeftSidebarOpen = useCallback((value: SetStateAction<boolean>) => {
    dispatch({ type: 'setLeftSidebarOpen', value: resolveSetter(value, state.leftSidebarOpen) });
  }, [state.leftSidebarOpen]);

  const setIsCodeMode = useCallback((value: SetStateAction<boolean>) => {
    dispatch({ type: 'setCodeMode', value: resolveSetter(value, state.isCodeMode) });
  }, [state.isCodeMode]);

  const setIsFullscreen = useCallback((value: SetStateAction<boolean>) => {
    dispatch({ type: 'setFullscreen', value: resolveSetter(value, state.isFullscreen) });
  }, [state.isFullscreen]);

  const setCommandPaletteOpen = useCallback((value: SetStateAction<boolean>) => {
    dispatch({ type: 'setCommandPaletteOpen', value: resolveSetter(value, state.commandPaletteOpen) });
  }, [state.commandPaletteOpen]);

  const setSearchOpen = useCallback((value: SetStateAction<boolean>) => {
    dispatch({ type: 'setSearchOpen', value: resolveSetter(value, state.searchOpen) });
  }, [state.searchOpen]);

  const setSearchQuery = useCallback((value: SetStateAction<string>) => {
    dispatch({ type: 'setSearchQuery', value: resolveSetter(value, state.searchQuery) });
  }, [state.searchQuery]);

  const setActiveMatchIndex = useCallback((value: SetStateAction<number>) => {
    dispatch({ type: 'setActiveMatchIndex', value: resolveSetter(value, state.activeMatchIndex) });
  }, [state.activeMatchIndex]);

  const resetSearch = useCallback(() => dispatch({ type: 'resetSearch' }), []);

  const value = useMemo<AppUIContextValue>(() => ({
    ...state,
    dispatch,
    setTheme,
    setWorkspaceCategory,
    setNotepadViewMode,
    setSidebarOpen,
    setLeftSidebarOpen,
    setIsCodeMode,
    setIsFullscreen,
    setCommandPaletteOpen,
    setSearchOpen,
    setSearchQuery,
    setActiveMatchIndex,
    resetSearch,
  }), [
    state,
    setTheme,
    setWorkspaceCategory,
    setNotepadViewMode,
    setSidebarOpen,
    setLeftSidebarOpen,
    setIsCodeMode,
    setIsFullscreen,
    setCommandPaletteOpen,
    setSearchOpen,
    setSearchQuery,
    setActiveMatchIndex,
    resetSearch,
  ]);

  return <AppUIContext.Provider value={value}>{children}</AppUIContext.Provider>;
}

export function useAppUI(): AppUIContextValue {
  const context = useContext(AppUIContext);
  if (!context) {
    throw new Error('useAppUI must be used inside AppUIProvider');
  }
  return context;
}
