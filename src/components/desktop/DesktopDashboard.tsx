import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  FolderKanban,
  FolderGit2,
  LayoutTemplate,
  History,
  Star,
  Users,
  WifiOff,
  Settings,
  Plus,
  Search,
  Clock,
  Pin,
  ArrowUpRight,
  User,
  Check,
  ChevronRight,
  Download,
  FileCode,
  FileText,
  Sparkles,
  Command,
  Moon,
  Sun,
  Laptop,
  Activity,
  MoreVertical,
  ExternalLink,
  Shield,
  Trash2,
  HardDrive,
  CloudCheck,
  Zap,
  FolderOpen,
  LogOut
} from 'lucide-react';
import Logo from '../Logo';
import { getRecentWorkspaces, togglePinWorkspace, toggleFavoriteWorkspace, RecentWorkspaceItem } from '../../utils/recentWorkspaces';
import { WORKSPACE_TYPES } from '../../utils/workspace';
import { getDesktopUserProfile, DesktopUserProfile, getUserAvatarInitials } from '../../utils/desktopProfile';
import { DesktopProfileModal } from './DesktopProfileModal';
import { Theme } from '../../types';
import { WorkspaceLibraryService, UserWorkspaceRef } from '../../services/workspaceLibraryService';
import { auth } from '../../lib/firebase';

interface DesktopDashboardProps {
  userName: string;
  onOpenWorkspace: (code: string) => void;
  onOpenLocalNote: (id?: string) => void;
  onOpenCreateWizard: () => void;
  onOpenJoinModal: () => void;
  onOpenAdminModal: () => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

type SidebarTab = 
  | 'home' 
  | 'workspaces' 
  | 'recent' 
  | 'favorites' 
  | 'shared' 
  | 'settings';

export const DesktopDashboard: React.FC<DesktopDashboardProps> = ({
  userName,
  onOpenWorkspace,
  onOpenLocalNote,
  onOpenCreateWizard,
  onOpenJoinModal,
  onOpenAdminModal,
  theme,
  onThemeChange,
}) => {
  const [activeTab, setActiveTab] = useState<SidebarTab>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentItems, setRecentItems] = useState<RecentWorkspaceItem[]>([]);
  const [userProfile, setUserProfile] = useState<DesktopUserProfile | null>(() => getDesktopUserProfile());
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const [isAvatarDropdownOpen, setIsAvatarDropdownOpen] = useState(false);
  const [keyboardIndex, setKeyboardIndex] = useState<number>(-1);
  const [libraryItems, setLibraryItems] = useState<UserWorkspaceRef[]>([]);
  const [openCardMenuId, setOpenCardMenuId] = useState<string | null>(null);

  const currentUid = auth?.currentUser?.uid || (typeof window !== 'undefined' ? localStorage.getItem('livepad_local_uid') : null);

  // Subscribe to persistent workspace library
  useEffect(() => {
    const unsub = WorkspaceLibraryService.subscribeUserLibrary(currentUid, (items) => {
      setLibraryItems(items);
    });
    return () => unsub();
  }, [currentUid]);

  // Load recents & user profile
  const reloadData = () => {
    setRecentItems(getRecentWorkspaces());
    setUserProfile(getDesktopUserProfile());
  };

  useEffect(() => {
    reloadData();
    const handleStorageChange = () => reloadData();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleToggleFavoriteLib = async (e: React.MouseEvent, wsId: string, currentFav: boolean) => {
    e.stopPropagation();
    await WorkspaceLibraryService.toggleFavorite(currentUid, wsId, !currentFav);
    reloadData();
  };

  const handleTogglePinLib = async (e: React.MouseEvent, wsId: string, currentPinned: boolean) => {
    e.stopPropagation();
    await WorkspaceLibraryService.togglePin(currentUid, wsId, !currentPinned);
    reloadData();
  };

  const handleToggleArchiveLib = async (e: React.MouseEvent, wsId: string, currentArchived: boolean) => {
    e.stopPropagation();
    await WorkspaceLibraryService.toggleArchive(currentUid, wsId, !currentArchived);
    setOpenCardMenuId(null);
    reloadData();
  };

  const handleRemoveFromLib = async (e: React.MouseEvent, wsId: string) => {
    e.stopPropagation();
    if (window.confirm('Remove this workspace reference from your library? (The online room and other members will not be affected)')) {
      await WorkspaceLibraryService.removeFromLibrary(currentUid, wsId);
      setOpenCardMenuId(null);
      reloadData();
    }
  };

  const handleDeleteWorkspaceLib = async (e: React.MouseEvent, wsId: string) => {
    e.stopPropagation();
    if (window.confirm('Permanently delete this workspace for all participants? This action cannot be undone.')) {
      await WorkspaceLibraryService.deleteWorkspacePermanently(currentUid, wsId);
      setOpenCardMenuId(null);
      reloadData();
    }
  };

  const isDark = theme === 'dark';

  // Derived filtered recents
  const filteredRecents = useMemo(() => {
    return recentItems.filter(
      (it) =>
        it.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        it.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (it.category && it.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [recentItems, searchQuery]);

  const favoritesList = useMemo(() => {
    return recentItems.filter((it) => it.isFavorite || it.isPinned);
  }, [recentItems]);

  const lastWorkspace = useMemo(() => {
    return recentItems.length > 0 ? recentItems[0] : null;
  }, [recentItems]);

  const visibleRecents = useMemo(() => {
    if (activeTab === 'home') return filteredRecents.slice(0, 6);
    if (activeTab === 'recent' || activeTab === 'workspaces') return filteredRecents;
    if (activeTab === 'favorites') return favoritesList;
    return [];
  }, [activeTab, filteredRecents, favoritesList]);

  // Keyboard Navigation for Workspaces
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!['home', 'workspaces', 'recent', 'favorites'].includes(activeTab)) return;
      if (visibleRecents.length === 0) return;

      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setKeyboardIndex((prev) => (prev < 0 ? 0 : (prev + 1) % visibleRecents.length));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setKeyboardIndex((prev) => (prev <= 0 ? visibleRecents.length - 1 : prev - 1));
      } else if (e.key === 'Enter') {
        if (keyboardIndex >= 0 && keyboardIndex < visibleRecents.length) {
          e.preventDefault();
          handleLaunchItem(visibleRecents[keyboardIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, visibleRecents, keyboardIndex]);

  const handleLaunchItem = (item: RecentWorkspaceItem) => {
    if (item.isLocal) {
      onOpenLocalNote(item.id);
    } else {
      onOpenWorkspace(item.code);
    }
  };

  const userFirstName = userProfile?.firstName || userName || 'User';
  const effectiveDisplayName = userProfile?.displayName || userFirstName;
  const avatarInitials = getUserAvatarInitials(userProfile, userFirstName);
  const profileColor = userProfile?.profileColor || '#6366f1';

  // Formatting relative time
  const formatTimeAgo = (ts: number) => {
    const diffMin = Math.floor((Date.now() - ts) / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  const sidebarNavItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'workspaces', label: 'Workspaces', icon: FolderKanban },
    { id: 'recent', label: 'Recent Notes', icon: History },
    { id: 'favorites', label: 'Favorites', icon: Star },
    { id: 'shared', label: 'Shared with Me', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className={`flex h-screen w-screen font-sans select-none overflow-hidden transition-colors ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* ================= SIDEBAR ================= */}
      <aside className={`w-56 h-full flex flex-col justify-between border-r shrink-0 transition-colors ${
        isDark ? 'bg-slate-900/80 border-slate-800/80' : 'bg-white border-slate-200/80 shadow-sm'
      }`}>
        <div>
          {/* Brand Header */}
          <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-slate-200/60 dark:border-slate-800/60">
            <div className="p-1.5 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <Logo iconSize={20} showText={false} />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white leading-none">
                LivePad
              </span>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                Desktop Edition v1.0
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-2.5 space-y-1">
            {sidebarNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as SidebarTab);
                    setKeyboardIndex(-1);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? isDark
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/80'
                      : isDark
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={15} className={isActive ? (isDark ? 'text-white' : 'text-indigo-600') : 'text-slate-400'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Identity Footer Card */}
        <div className="p-3 border-t border-slate-200/60 dark:border-slate-800/60">
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className={`w-full flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
              isDark ? 'hover:bg-slate-800/70 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <div 
                className="w-8 h-8 rounded-full text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm"
                style={{ backgroundColor: profileColor }}
              >
                {avatarInitials}
              </div>
              <div className="truncate text-left">
                <div className="text-xs font-bold truncate leading-tight">
                  {effectiveDisplayName}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  Desktop Member
                </div>
              </div>
            </div>
            <Settings size={14} className="text-slate-400 shrink-0" />
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TOP HEADER */}
        <header className={`h-13 px-6 border-b flex items-center justify-between shrink-0 transition-colors ${
          isDark ? 'bg-slate-900/40 border-slate-800/80' : 'bg-white border-slate-200/80'
        }`}>
          {/* Global Search */}
          <div className="relative w-full max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search workspaces & notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-7 py-1.5 rounded-xl border text-xs font-medium outline-none transition-all ${
                isDark
                  ? 'bg-slate-800/60 border-slate-700/80 text-white placeholder-slate-500 focus:border-indigo-500'
                  : 'bg-slate-100/80 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ×
              </button>
            )}
          </div>

          {/* Quick Action Button & Theme Selector */}
          <div className="flex items-center gap-2.5">
            {/* New Action Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsQuickMenuOpen((prev) => !prev)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
              >
                <Plus size={15} />
                <span>New</span>
              </button>

              {isQuickMenuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setIsQuickMenuOpen(false)} />
                  <div className={`absolute right-0 mt-2 w-48 rounded-2xl border shadow-xl py-1.5 z-30 transition-all ${
                    isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                  }`}>
                    <button
                      onClick={() => { setIsQuickMenuOpen(false); onOpenCreateWizard(); }}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center gap-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 transition-all cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>New Workspace</span>
                    </button>
                    <button
                      onClick={() => { setIsQuickMenuOpen(false); onOpenJoinModal(); }}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center gap-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 transition-all cursor-pointer"
                    >
                      <Users size={14} />
                      <span>Join Room</span>
                    </button>
                    <button
                      onClick={() => { setIsQuickMenuOpen(false); onOpenLocalNote(); }}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center gap-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 transition-all cursor-pointer"
                    >
                      <FileText size={14} />
                      <span>New Scratchpad Note</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={() => onThemeChange(isDark ? 'light' : 'dark')}
              className={`p-1.5 rounded-xl border text-xs transition-all cursor-pointer ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' 
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
              title="Toggle Light/Dark Theme"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Profile Avatar Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsAvatarDropdownOpen((prev) => !prev)}
                className="w-8 h-8 rounded-full text-white font-extrabold text-xs flex items-center justify-center shadow-sm cursor-pointer hover:ring-2 hover:ring-indigo-500/40 transition-all"
                style={{ backgroundColor: profileColor }}
              >
                {avatarInitials}
              </button>

              {isAvatarDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setIsAvatarDropdownOpen(false)} />
                  <div className={`absolute right-0 mt-2 w-52 rounded-2xl border shadow-xl py-2 z-30 transition-all ${
                    isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                  }`}>
                    <div className="px-3.5 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                      <div className="text-xs font-bold truncate">{effectiveDisplayName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Desktop Member</div>
                    </div>
                    <button
                      onClick={() => { setIsAvatarDropdownOpen(false); setIsProfileModalOpen(true); }}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <User size={14} />
                      <span>Edit Profile Identity</span>
                    </button>
                    <button
                      onClick={() => { setIsAvatarDropdownOpen(false); setActiveTab('settings'); }}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Settings size={14} />
                      <span>Desktop Settings</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* DASHBOARD CONTAINER BODY */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {activeTab === 'home' && (
            <>
              {/* Header Welcome Banner */}
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Welcome back, {userFirstName} 👋
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  Your desktop workspace home. Reopen a recent session or start a new document.
                </p>
              </div>

              {/* Continue Working Compact Hero */}
              {lastWorkspace && (
                <div className={`p-4 rounded-2xl border shadow-sm transition-all ${
                  isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/90'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400 font-mono">
                      Continue Working
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {formatTimeAgo(lastWorkspace.lastAccessedAt)}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                        {lastWorkspace.title}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {lastWorkspace.isLocal ? 'Private Scratchpad Note' : `Room Code: #${lastWorkspace.code}`}
                      </p>
                    </div>

                    <button
                      onClick={() => handleLaunchItem(lastWorkspace)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md self-start sm:self-auto cursor-pointer"
                    >
                      <span>Resume Workspace</span>
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Primary Tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={onOpenCreateWizard}
                  className={`p-3.5 rounded-2xl border transition-all text-left flex items-center justify-between group cursor-pointer ${
                    isDark
                      ? 'bg-slate-900/60 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900'
                      : 'bg-white border-slate-200 hover:border-indigo-500/50 hover:bg-indigo-50/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
                      <Plus size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white">New Workspace</h3>
                      <p className="text-[10px] text-slate-400">Code or document</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={onOpenJoinModal}
                  className={`p-3.5 rounded-2xl border transition-all text-left flex items-center justify-between group cursor-pointer ${
                    isDark
                      ? 'bg-slate-900/60 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900'
                      : 'bg-white border-slate-200 hover:border-indigo-500/50 hover:bg-indigo-50/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400">
                      <Users size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white">Join Room</h3>
                      <p className="text-[10px] text-slate-400">Collaborate via code</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => onOpenLocalNote()}
                  className={`p-3.5 rounded-2xl border transition-all text-left flex items-center justify-between group cursor-pointer ${
                    isDark
                      ? 'bg-slate-900/60 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900'
                      : 'bg-white border-slate-200 hover:border-indigo-500/50 hover:bg-indigo-50/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-600/10 text-amber-600 dark:text-amber-400">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white">Scratchpad</h3>
                      <p className="text-[10px] text-slate-400">Private offline note</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Recent Workspaces Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                    <Clock size={15} className="text-indigo-600 dark:text-indigo-400" />
                    <span>Recent Workspaces & Notes</span>
                  </h3>
                  {recentItems.length > 0 && (
                    <button
                      onClick={() => setActiveTab('recent')}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                    >
                      View All ({recentItems.length})
                    </button>
                  )}
                </div>

                {filteredRecents.length === 0 ? (
                  <div className={`p-8 rounded-2xl border text-center text-slate-500 ${
                    isDark ? 'bg-slate-900/30 border-slate-800' : 'bg-slate-100/60 border-slate-200'
                  }`}>
                    <Clock size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-semibold">No recent workspaces found</p>
                    <p className="text-[11px] text-slate-400 mt-1">Create a note or join a room to get started.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {filteredRecents.slice(0, 6).map((item, idx) => {
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleLaunchItem(item)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer group flex flex-col justify-between space-y-2.5 relative outline-none ${
                            isDark
                              ? 'bg-slate-900/70 border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900 shadow-sm'
                              : 'bg-white border-slate-200/90 hover:border-indigo-500/40 hover:bg-slate-50 shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="truncate pr-2">
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase mb-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                                {item.category || (item.isLocal ? 'Scratchpad' : 'Workspace')}
                              </span>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {item.title}
                              </h4>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleFavoriteWorkspace(item.id); reloadData(); }}
                                className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 ${
                                  item.isFavorite ? 'text-amber-500' : 'text-slate-400'
                                }`}
                                title="Favorite"
                              >
                                <Star size={13} className={item.isFavorite ? 'fill-current' : ''} />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-800 font-mono">
                            <span>#{item.code}</span>
                            <span>{formatTimeAgo(item.lastAccessedAt)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Status & Desktop Info Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Desktop Sync Widget */}
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-900 dark:text-white">
                    <CloudCheck size={16} className="text-emerald-500" />
                    <span>Desktop Storage & Cloud Sync</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    LivePad caches your workspace data locally for instant startup and offline capability. Changes push to Firestore whenever connected.
                  </p>
                </div>

                {/* Collaboration Identity Widget */}
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-900 dark:text-white">
                    <Zap size={16} className="text-indigo-500" />
                    <span>Realtime Collaboration Identity</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Active as <strong className="text-slate-800 dark:text-slate-200">{effectiveDisplayName}</strong>. Teammates see your custom avatar badge and real-time cursor in shared workspaces.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* TAB: WORKSPACES / RECENT / FAVORITES / SHARED */}
          {['workspaces', 'recent', 'favorites', 'shared'].includes(activeTab) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize">{activeTab} Workspaces</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click any workspace to reopen and sync live.
                  </p>
                </div>
                <button
                  onClick={onOpenCreateWizard}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Plus size={14} />
                  <span>New Workspace</span>
                </button>
              </div>

              {(() => {
                let itemsToDisplay: UserWorkspaceRef[] = libraryItems.length > 0 ? libraryItems : filteredRecents.map(r => ({
                  id: r.id,
                  workspaceId: r.id,
                  roomCode: r.code,
                  title: r.title,
                  category: r.category,
                  workspaceType: r.type || 'team',
                  role: 'Editor',
                  joinedAt: r.lastAccessedAt,
                  lastOpened: r.lastAccessedAt,
                  favorite: !!r.isFavorite,
                  pinned: !!r.isPinned,
                  archived: false,
                  owner: false,
                  ownerName: 'LivePad Member',
                  syncStatus: r.isLocal ? ('offline' as const) : ('synced' as const),
                  lastSyncTime: r.lastAccessedAt,
                  memberCount: 1,
                }));

                if (searchQuery) {
                  itemsToDisplay = itemsToDisplay.filter(
                    (it) =>
                      it.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      it.roomCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (it.category && it.category.toLowerCase().includes(searchQuery.toLowerCase()))
                  );
                }

                if (activeTab === 'favorites') {
                  itemsToDisplay = itemsToDisplay.filter((it) => it.favorite);
                } else if (activeTab === 'shared') {
                  itemsToDisplay = itemsToDisplay.filter((it) => !it.owner);
                }

                if (itemsToDisplay.length === 0) {
                  return (
                    <div className={`p-8 rounded-2xl border text-center text-slate-500 ${
                      isDark ? 'bg-slate-900/30 border-slate-800' : 'bg-slate-100/60 border-slate-200'
                    }`}>
                      <FolderKanban size={32} className="mx-auto mb-2 opacity-40 text-indigo-500" />
                      <p className="text-sm font-bold text-slate-900 dark:text-white">No items found in {activeTab}</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {itemsToDisplay.map((item) => (
                      <div
                        key={item.workspaceId}
                        onClick={() => onOpenWorkspace(item.roomCode || item.workspaceId)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer group flex flex-col justify-between space-y-2.5 relative outline-none ${
                          isDark
                            ? 'bg-slate-900/70 border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-900 shadow-sm'
                            : 'bg-white border-slate-200/90 hover:border-indigo-500/50 hover:bg-slate-50 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="truncate">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 mb-1">
                              {item.category || 'Workspace'}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {item.title}
                            </h4>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={(e) => handleToggleFavoriteLib(e, item.workspaceId, item.favorite)}
                              className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 ${item.favorite ? 'text-amber-500' : 'text-slate-400'}`}
                              title="Favorite"
                            >
                              <Star size={13} className={item.favorite ? 'fill-current' : ''} />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-800 font-mono">
                          <span>#{item.roomCode || item.workspaceId}</span>
                          <span>{formatTimeAgo(item.lastOpened)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Desktop Settings</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure your desktop experience, profile identity, and theme.
                </p>
              </div>

              {/* Profile Card Settings */}
              <div className={`p-5 rounded-2xl border space-y-4 ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full text-white font-extrabold text-sm flex items-center justify-center shadow-md"
                      style={{ backgroundColor: profileColor }}
                    >
                      {avatarInitials}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">{effectiveDisplayName}</h3>
                      <p className="text-[11px] text-slate-400">Collaboration Profile Identity</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsProfileModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-sm cursor-pointer"
                  >
                    Edit Profile
                  </button>
                </div>

                {/* Theme Selector Section */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Theme Preference</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'light', label: 'Light Theme', icon: Sun },
                      { id: 'dark', label: 'Dark Theme', icon: Moon },
                      { id: 'system', label: 'System Theme', icon: Laptop },
                    ].map((t) => {
                      const Icon = t.icon;
                      const isActive = theme === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => onThemeChange(t.id as any)}
                          className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            isActive
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <Icon size={14} />
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Desktop Profile Modal */}
      <DesktopProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={userProfile}
        onSaveProfile={(updated) => {
          setUserProfile(updated);
          reloadData();
        }}
        theme={theme}
        onThemeChange={onThemeChange}
      />
    </div>
  );
};
