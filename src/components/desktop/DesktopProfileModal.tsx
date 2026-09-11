import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Check, Sun, Moon, Laptop, ShieldCheck, Palette } from 'lucide-react';
import { DesktopUserProfile, saveDesktopUserProfile, getUserAvatarInitials } from '../../utils/desktopProfile';
import { Theme } from '../../types';

interface DesktopProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: DesktopUserProfile | null;
  onSaveProfile: (updated: DesktopUserProfile) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const COLOR_OPTIONS = [
  { id: '#6366f1', label: 'Indigo', bgClass: 'bg-indigo-600' },
  { id: '#ec4899', label: 'Pink', bgClass: 'bg-pink-600' },
  { id: '#10b981', label: 'Emerald', bgClass: 'bg-emerald-600' },
  { id: '#f59e0b', label: 'Amber', bgClass: 'bg-amber-500' },
  { id: '#8b5cf6', label: 'Purple', bgClass: 'bg-purple-600' },
  { id: '#3b82f6', label: 'Blue', bgClass: 'bg-blue-600' },
  { id: '#14b8a6', label: 'Teal', bgClass: 'bg-teal-600' },
];

export const DesktopProfileModal: React.FC<DesktopProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  theme,
  onThemeChange,
}) => {
  const [firstName, setFirstName] = useState(profile?.firstName || '');
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [gender, setGender] = useState<'male' | 'female' | 'prefer_not_to_say'>(
    profile?.gender || 'prefer_not_to_say'
  );
  const [profileColor, setProfileColor] = useState(profile?.profileColor || '#6366f1');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setDisplayName(profile.displayName || '');
      setGender(profile.gender || 'prefer_not_to_say');
      setProfileColor(profile.profileColor || '#6366f1');
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const initials = getUserAvatarInitials(profile, firstName);
  const isDark = theme === 'dark';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) return;

    const updated = saveDesktopUserProfile({
      firstName,
      displayName,
      gender,
      profileColor,
    });

    onSaveProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={`w-full max-w-md rounded-2xl border shadow-xl p-6 relative overflow-hidden transition-all ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-slate-950/80'
              : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/60'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full text-white font-bold text-sm flex items-center justify-center shadow-md ring-2 ring-indigo-500/30"
                style={{ backgroundColor: profileColor }}
              >
                {initials}
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                  {displayName || firstName || 'User Identity'}
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Desktop Collaboration Profile
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSave} className="mt-5 space-y-4">
            {savedSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <ShieldCheck size={16} />
                <span>Profile & identity updated!</span>
              </div>
            )}

            {/* First Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">First Name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border text-xs font-medium outline-none transition-all bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-indigo-500"
              />
            </div>

            {/* Display Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Optional display nickname"
                className="w-full px-3.5 py-2 rounded-xl border text-xs font-medium outline-none transition-all bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-indigo-500"
              />
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Gender</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'male', label: 'Male' },
                  { id: 'female', label: 'Female' },
                  { id: 'prefer_not_to_say', label: 'Prefer not' },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setGender(opt.id as any)}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition-all text-center cursor-pointer ${
                      gender === opt.id
                        ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Profile Color Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Palette size={14} className="text-indigo-500" />
                <span>Profile & Cursor Color</span>
              </label>
              <div className="flex items-center gap-2 pt-1">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setProfileColor(c.id)}
                    className={`w-7 h-7 rounded-full ${c.bgClass} flex items-center justify-center text-white transition-all cursor-pointer ${
                      profileColor === c.id ? 'ring-4 ring-indigo-500/30 scale-110 shadow-md' : 'opacity-80 hover:opacity-100'
                    }`}
                    title={c.label}
                  >
                    {profileColor === c.id && <Check size={14} className="stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Selector */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Appearance Theme</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'light', label: 'Light', icon: Sun },
                  { id: 'dark', label: 'Dark', icon: Moon },
                  { id: 'system', label: 'System', icon: Laptop },
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = theme === t.id;
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => onThemeChange(t.id as any)}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                      }`}
                    >
                      <Icon size={14} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-md cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
