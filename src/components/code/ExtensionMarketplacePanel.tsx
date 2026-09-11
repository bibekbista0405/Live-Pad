import React, { useState, useEffect, useSyncExternalStore } from 'react';
import {
  Search,
  Blocks,
  Download,
  Star,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trash2,
  Sliders,
  Sparkles,
  Palette,
  FileCode2,
  Globe,
  Settings,
  ShieldCheck,
  PlusCircle,
  Upload,
  Info,
  ExternalLink,
  ChevronRight,
  Zap,
  Terminal,
  Code
} from 'lucide-react';
import {
  ExtensionManifest,
  InstalledExtension,
  ExtensionCategory,
  ExtensionThemeContribution
} from '../../types/extension';
import { extensionRegistry } from '../../services/extensionRegistry';

interface ExtensionMarketplacePanelProps {
  onOpenSettings?: () => void;
  onAddToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export function ExtensionMarketplacePanel({ onOpenSettings, onAddToast }: ExtensionMarketplacePanelProps) {
  // Use React sync external store for live updates
  const catalog = useSyncExternalStore(
    (cb) => extensionRegistry.subscribe(cb),
    () => extensionRegistry.getCatalog()
  );

  const installedList = useSyncExternalStore(
    (cb) => extensionRegistry.subscribe(cb),
    () => extensionRegistry.getInstalledExtensions()
  );

  const activeThemeId = useSyncExternalStore(
    (cb) => extensionRegistry.subscribe(cb),
    () => extensionRegistry.getActiveThemeId()
  );

  const activeIconPackId = useSyncExternalStore(
    (cb) => extensionRegistry.subscribe(cb),
    () => extensionRegistry.getActiveIconPackId()
  );

  const activeLocale = useSyncExternalStore(
    (cb) => extensionRegistry.subscribe(cb),
    () => extensionRegistry.getActiveLocale()
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExtensionCategory | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'marketplace' | 'installed' | 'updates' | 'config'>('marketplace');
  const [selectedExtension, setSelectedExtension] = useState<ExtensionManifest | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'contributes' | 'changelog'>('overview');

  // Sideload custom extension modal state
  const [isSideloadModalOpen, setIsSideloadModalOpen] = useState(false);
  const [sideloadContent, setSideloadContent] = useState('');

  // Map category to icon
  const getCategoryIcon = (category: ExtensionCategory) => {
    switch (category) {
      case 'themes':
        return <Palette className="w-4 h-4 text-purple-400" />;
      case 'icons':
        return <FileCode2 className="w-4 h-4 text-sky-400" />;
      case 'snippets':
        return <Code className="w-4 h-4 text-emerald-400" />;
      case 'language-packs':
        return <Globe className="w-4 h-4 text-amber-400" />;
      case 'ai-tools':
        return <Sparkles className="w-4 h-4 text-rose-400" />;
    }
  };

  // Filtered items
  const filteredCatalog = catalog.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.publisher.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const installedMap = new Map<string, InstalledExtension>();
  installedList.forEach((inst) => installedMap.set(inst.manifest.id, inst));

  const updatesAvailable = installedList.filter((inst) => inst.hasUpdate);

  const handleSideload = () => {
    if (!sideloadContent.trim()) return;
    const result = extensionRegistry.loadDynamicBundle(sideloadContent.trim());
    if (result.success) {
      if (onAddToast) onAddToast('success', result.message);
      setIsSideloadModalOpen(false);
      setSideloadContent('');
    } else {
      if (onAddToast) onAddToast('error', result.message);
    }
  };

  return (
    <div className="w-full h-full bg-[#181818] border-r border-[#252526] flex flex-col font-sans select-none overflow-hidden text-xs text-slate-200">
      {/* Panel Top Header */}
      <div className="p-3 border-b border-[#252526] bg-[#1e1e1e] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Blocks className="w-4 h-4 text-purple-400" />
          <span className="font-bold text-slate-100 uppercase tracking-wider text-[11px]">
            {extensionRegistry.getTranslation('Extensions Marketplace')}
          </span>
        </div>
        <button
          onClick={() => setIsSideloadModalOpen(true)}
          className="px-2 py-1 bg-purple-600/80 hover:bg-purple-500 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-all"
          title="Sideload Custom Extension Manifest or Script (.json/.js)"
        >
          <Upload className="w-3 h-3" /> Sideload
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center border-b border-[#252526] bg-[#141414] px-2 text-[11px] font-semibold shrink-0">
        <button
          onClick={() => setActiveTab('marketplace')}
          className={`px-3 py-2 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'marketplace'
              ? 'border-purple-500 text-purple-300 bg-[#1e1e1e]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Marketplace
        </button>
        <button
          onClick={() => setActiveTab('installed')}
          className={`px-3 py-2 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'installed'
              ? 'border-purple-500 text-purple-300 bg-[#1e1e1e]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Installed ({installedList.length})
        </button>
        <button
          onClick={() => setActiveTab('updates')}
          className={`px-3 py-2 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'updates'
              ? 'border-purple-500 text-purple-300 bg-[#1e1e1e]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Updates {updatesAvailable.length > 0 && <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px]">{updatesAvailable.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`px-3 py-2 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'config'
              ? 'border-purple-500 text-purple-300 bg-[#1e1e1e]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Active Config
        </button>
      </div>

      {/* Search and Category Filters (When in Marketplace or Installed) */}
      {activeTab !== 'config' && (
        <div className="p-2.5 border-b border-[#252526] bg-[#1a1a1a] space-y-2 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search extensions by name, category, or author..."
              className="w-full bg-[#111111] border border-[#333333] rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1 text-[11px]">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2 py-0.5 rounded-full transition-all cursor-pointer shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'bg-[#252526] text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedCategory('themes')}
              className={`px-2 py-0.5 rounded-full transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                selectedCategory === 'themes'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'bg-[#252526] text-slate-400 hover:text-slate-200'
              }`}
            >
              <Palette className="w-3 h-3 text-purple-400" /> Themes
            </button>
            <button
              onClick={() => setSelectedCategory('icons')}
              className={`px-2 py-0.5 rounded-full transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                selectedCategory === 'icons'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'bg-[#252526] text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode2 className="w-3 h-3 text-sky-400" /> Icons
            </button>
            <button
              onClick={() => setSelectedCategory('snippets')}
              className={`px-2 py-0.5 rounded-full transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                selectedCategory === 'snippets'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'bg-[#252526] text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3 h-3 text-emerald-400" /> Snippets
            </button>
            <button
              onClick={() => setSelectedCategory('language-packs')}
              className={`px-2 py-0.5 rounded-full transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                selectedCategory === 'language-packs'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'bg-[#252526] text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3 h-3 text-amber-400" /> i18n
            </button>
            <button
              onClick={() => setSelectedCategory('ai-tools')}
              className={`px-2 py-0.5 rounded-full transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                selectedCategory === 'ai-tools'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'bg-[#252526] text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3 h-3 text-rose-400" /> AI Tools
            </button>
          </div>
        </div>
      )}

      {/* Main Extension List View */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
        {activeTab === 'marketplace' && (
          filteredCatalog.length === 0 ? (
            <div className="text-center py-8 text-slate-500 italic">
              No extensions found matching "{searchQuery}".
            </div>
          ) : (
            filteredCatalog.map((manifest) => {
              const installed = installedMap.get(manifest.id);
              return (
                <div
                  key={manifest.id}
                  onClick={() => setSelectedExtension(manifest)}
                  className="p-2.5 bg-[#1f1f1f] hover:bg-[#282828] border border-[#2d2d2d] hover:border-purple-500/50 rounded-lg transition-all cursor-pointer space-y-2 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 border border-white/10"
                        style={{ backgroundColor: manifest.bannerColor || '#2d2d2d' }}
                      >
                        {getCategoryIcon(manifest.category)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-100 group-hover:text-purple-300 truncate text-xs">
                          {manifest.displayName}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                          <span>{manifest.publisher}</span>
                          <span>•</span>
                          <span className="text-purple-400 font-mono">v{manifest.version}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {!installed ? (
                        <button
                          onClick={() => {
                            extensionRegistry.installExtension(manifest);
                            if (onAddToast) onAddToast('success', `Installed ${manifest.displayName}`);
                          }}
                          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded text-[11px] flex items-center gap-1 transition-all"
                        >
                          <Download className="w-3 h-3" />
                          {extensionRegistry.getTranslation('Install')}
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              if (installed.enabled) extensionRegistry.disableExtension(manifest.id);
                              else extensionRegistry.enableExtension(manifest.id);
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              installed.enabled
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            {installed.enabled ? extensionRegistry.getTranslation('Enable') : extensionRegistry.getTranslation('Disable')}
                          </button>
                          <button
                            onClick={() => {
                              extensionRegistry.removeExtension(manifest.id);
                              if (onAddToast) onAddToast('info', `Removed ${manifest.displayName}`);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Uninstall Extension"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {manifest.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-[#2a2a2a]">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Download className="w-3 h-3" /> {(manifest.downloads / 1000).toFixed(0)}k
                      </span>
                      <span className="flex items-center gap-1 text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400" /> {manifest.rating}
                      </span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-[#252526] text-slate-400 uppercase font-mono text-[9px]">
                      {manifest.category}
                    </span>
                  </div>
                </div>
              );
            })
          )
        )}

        {/* Installed Extensions Tab */}
        {activeTab === 'installed' && (
          installedList.length === 0 ? (
            <div className="text-center py-8 text-slate-500 italic">
              No extensions installed yet. Browse the Marketplace to install themes, icons, and AI tools.
            </div>
          ) : (
            installedList.map((inst) => (
              <div
                key={inst.manifest.id}
                onClick={() => setSelectedExtension(inst.manifest)}
                className="p-2.5 bg-[#1f1f1f] hover:bg-[#282828] border border-[#2d2d2d] rounded-lg space-y-2 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: inst.manifest.bannerColor || '#2d2d2d' }}
                    >
                      {getCategoryIcon(inst.manifest.category)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-100 flex items-center gap-1.5 text-xs">
                        <span>{inst.manifest.displayName}</span>
                        {inst.enabled && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <span>{inst.manifest.publisher}</span>
                        <span>•</span>
                        <span className="text-purple-400">v{inst.installedVersion}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        if (inst.enabled) extensionRegistry.disableExtension(inst.manifest.id);
                        else extensionRegistry.enableExtension(inst.manifest.id);
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                        inst.enabled
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {inst.enabled ? extensionRegistry.getTranslation('Enable') : extensionRegistry.getTranslation('Disable')}
                    </button>

                    <button
                      onClick={() => {
                        extensionRegistry.removeExtension(inst.manifest.id);
                        if (onAddToast) onAddToast('info', `Uninstalled ${inst.manifest.displayName}`);
                      }}
                      className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-900/50 rounded transition-all"
                      title="Uninstall Extension"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-1">{inst.manifest.description}</p>
              </div>
            ))
          )
        )}

        {/* Updates Tab */}
        {activeTab === 'updates' && (
          updatesAvailable.length === 0 ? (
            <div className="text-center py-8 text-slate-500 italic flex flex-col items-center gap-2">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
              <span>All installed extensions are up to date!</span>
            </div>
          ) : (
            updatesAvailable.map((inst) => (
              <div key={inst.manifest.id} className="p-3 bg-[#1f1f1f] border border-amber-500/30 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-100">{inst.manifest.displayName}</div>
                  <button
                    onClick={() => {
                      extensionRegistry.updateExtension(inst.manifest.id);
                      if (onAddToast) onAddToast('success', `Updated ${inst.manifest.displayName}`);
                    }}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-bold flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Update
                  </button>
                </div>
                <div className="text-[11px] text-slate-400">
                  Current: v{inst.installedVersion} → Latest: v{inst.manifest.version}
                </div>
              </div>
            ))
          )
        )}

        {/* Active Config Tab (Live theme, icon, locale select) */}
        {activeTab === 'config' && (
          <div className="p-3 space-y-4">
            {/* Active Theme Selection */}
            <div className="space-y-2 bg-[#1f1f1f] p-3 border border-[#2d2d2d] rounded-lg">
              <div className="font-bold text-slate-200 flex items-center gap-2 text-xs">
                <Palette className="w-4 h-4 text-purple-400" /> Active IDE Visual Theme
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {extensionRegistry.getAllThemes().map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      extensionRegistry.setActiveTheme(t.id);
                      if (onAddToast) onAddToast('info', `Active theme changed to ${t.label}`);
                    }}
                    className={`p-2 rounded border text-left flex items-center justify-between transition-all ${
                      activeThemeId === t.id
                        ? 'border-purple-500 bg-purple-950/30 text-purple-200 font-bold'
                        : 'border-[#2d2d2d] bg-[#141414] text-slate-300 hover:bg-[#252526]'
                    }`}
                  >
                    <span>{t.label}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: t.colors.background }} />
                      <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: t.colors.accentColor }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Language / i18n Locale */}
            <div className="space-y-2 bg-[#1f1f1f] p-3 border border-[#2d2d2d] rounded-lg">
              <div className="font-bold text-slate-200 flex items-center gap-2 text-xs">
                <Globe className="w-4 h-4 text-amber-400" /> Active Language Pack (i18n)
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {extensionRegistry.getAllAvailableLocales().map((loc) => (
                  <button
                    key={loc.locale}
                    onClick={() => {
                      extensionRegistry.setActiveLocale(loc.locale);
                      if (onAddToast) onAddToast('info', `Language changed to ${loc.label}`);
                    }}
                    className={`p-2 rounded border text-left flex items-center justify-between transition-all ${
                      activeLocale === loc.locale
                        ? 'border-amber-500 bg-amber-950/30 text-amber-200 font-bold'
                        : 'border-[#2d2d2d] bg-[#141414] text-slate-300 hover:bg-[#252526]'
                    }`}
                  >
                    <span>{loc.label}</span>
                    {activeLocale === loc.locale && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Extension Detail Modal / Drawer */}
      {selectedExtension && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#1e1e1e] border border-[#333333] rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-xs text-slate-200">
            {/* Modal Header */}
            <div
              className="p-4 border-b border-[#2d2d2d] flex items-start justify-between relative"
              style={{ backgroundColor: selectedExtension.bannerColor || '#252526' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-black/40 border border-white/20 rounded-lg flex items-center justify-center">
                  {getCategoryIcon(selectedExtension.category)}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{selectedExtension.displayName}</h2>
                  <p className="text-slate-300 text-[11px]">
                    By <span className="font-semibold text-purple-300">{selectedExtension.publisher}</span> • v{selectedExtension.version}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedExtension(null)}
                className="p-1 text-slate-300 hover:text-white bg-black/40 rounded-full transition-all"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Detail Tabs */}
            <div className="flex items-center border-b border-[#2d2d2d] bg-[#141414] px-4 font-semibold text-[11px]">
              <button
                onClick={() => setDetailTab('overview')}
                className={`px-3 py-2 border-b-2 transition-all ${
                  detailTab === 'overview' ? 'border-purple-500 text-purple-300' : 'border-transparent text-slate-400'
                }`}
              >
                Overview & Readme
              </button>
              <button
                onClick={() => setDetailTab('contributes')}
                className={`px-3 py-2 border-b-2 transition-all ${
                  detailTab === 'contributes' ? 'border-purple-500 text-purple-300' : 'border-transparent text-slate-400'
                }`}
              >
                Contributions
              </button>
              <button
                onClick={() => setDetailTab('changelog')}
                className={`px-3 py-2 border-b-2 transition-all ${
                  detailTab === 'changelog' ? 'border-purple-500 text-purple-300' : 'border-transparent text-slate-400'
                }`}
              >
                Changelog
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 font-sans">
              {detailTab === 'overview' && (
                <div className="space-y-3">
                  <p className="text-slate-300 leading-relaxed text-xs">{selectedExtension.description}</p>

                  <div className="p-3 bg-[#141414] border border-[#2d2d2d] rounded-lg space-y-2">
                    <div className="font-bold text-slate-200 uppercase text-[10px] tracking-wider">README</div>
                    <div className="text-slate-400 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                      {selectedExtension.readme || 'No detailed README provided for this extension.'}
                    </div>
                  </div>
                </div>
              )}

              {detailTab === 'contributes' && (
                <div className="space-y-3">
                  <div className="font-bold text-slate-200">Provided API Contributions:</div>

                  {selectedExtension.contributes.themes && (
                    <div className="p-2.5 bg-[#141414] border border-[#2d2d2d] rounded space-y-1">
                      <span className="font-bold text-purple-400">Themes ({selectedExtension.contributes.themes.length})</span>
                      {selectedExtension.contributes.themes.map((t) => (
                        <div key={t.id} className="text-[11px] text-slate-300 pl-2 border-l border-purple-500/40">
                          {t.label} ({t.uiTheme})
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedExtension.contributes.snippets && (
                    <div className="p-2.5 bg-[#141414] border border-[#2d2d2d] rounded space-y-1">
                      <span className="font-bold text-emerald-400">Snippets ({selectedExtension.contributes.snippets.length})</span>
                      {selectedExtension.contributes.snippets.map((s) => (
                        <div key={s.id} className="text-[11px] text-slate-300 pl-2 border-l border-emerald-500/40">
                          <span className="font-mono text-emerald-300">{s.prefix}</span> — {s.title}
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedExtension.contributes.aiTools && (
                    <div className="p-2.5 bg-[#141414] border border-[#2d2d2d] rounded space-y-1">
                      <span className="font-bold text-rose-400">AI Tools ({selectedExtension.contributes.aiTools.length})</span>
                      {selectedExtension.contributes.aiTools.map((tool) => (
                        <div key={tool.id} className="text-[11px] text-slate-300 pl-2 border-l border-rose-500/40">
                          <span className="font-bold">{tool.name}</span>: {tool.description}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'changelog' && (
                <div className="p-3 bg-[#141414] border border-[#2d2d2d] rounded text-slate-300 font-mono text-[11px]">
                  {selectedExtension.changelog || 'No changelog recorded.'}
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-3 border-t border-[#2d2d2d] bg-[#141414] flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-mono">ID: {selectedExtension.id}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedExtension(null)}
                  className="px-3 py-1.5 bg-[#2a2a2a] hover:bg-[#333333] text-slate-300 rounded font-semibold text-xs"
                >
                  Close
                </button>
                {installedMap.has(selectedExtension.id) ? (
                  <button
                    onClick={() => {
                      extensionRegistry.removeExtension(selectedExtension.id);
                      setSelectedExtension(null);
                      if (onAddToast) onAddToast('info', `Uninstalled ${selectedExtension.displayName}`);
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold text-xs"
                  >
                    Uninstall
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      extensionRegistry.installExtension(selectedExtension);
                      setSelectedExtension(null);
                      if (onAddToast) onAddToast('success', `Installed ${selectedExtension.displayName}`);
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold text-xs"
                  >
                    Install Extension
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sideload Custom Extension Modal */}
      {isSideloadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#1e1e1e] border border-purple-500/50 rounded-xl shadow-2xl p-4 space-y-3 text-xs text-slate-200">
            <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-2">
              <span className="font-bold text-purple-300 text-sm flex items-center gap-2">
                <Upload className="w-4 h-4" /> Sideload Dynamic Extension Bundle
              </span>
              <button onClick={() => setIsSideloadModalOpen(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-400 text-[11px]">
              Paste a JSON Extension Manifest or dynamic JS script. Extensions load dynamically into the runtime registry without rebuilding the application.
            </p>

            <textarea
              value={sideloadContent}
              onChange={(e) => setSideloadContent(e.target.value)}
              placeholder={`{\n  "id": "my-custom-theme",\n  "displayName": "My Neon Custom Theme",\n  "category": "themes",\n  "contributes": {\n    "themes": [...]\n  }\n}`}
              className="w-full h-48 bg-[#111111] border border-[#333333] rounded p-2.5 font-mono text-[11px] text-purple-200 outline-none focus:border-purple-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2d2d2d]">
              <button
                onClick={() => setIsSideloadModalOpen(false)}
                className="px-3 py-1.5 bg-[#2d2d2d] hover:bg-[#383838] text-slate-300 rounded font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSideload}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded text-xs flex items-center gap-1"
              >
                <Zap className="w-3.5 h-3.5" /> Execute & Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExtensionMarketplacePanel;
