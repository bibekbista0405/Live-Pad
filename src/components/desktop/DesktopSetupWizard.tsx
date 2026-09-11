import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  Check, 
  User, 
  Sparkles, 
  ShieldCheck, 
  UserCheck, 
  MousePointer, 
  WifiOff, 
  Users, 
  Cloud, 
  Code2, 
  FileText, 
  Palette, 
  CheckCircle2, 
  ChevronLeft 
} from 'lucide-react';
import Logo from '../Logo';
import { saveDesktopUserProfile, DesktopUserProfile, getUserAvatarInitials } from '../../utils/desktopProfile';
import { Theme } from '../../types';

interface DesktopSetupWizardProps {
  onComplete: (profile: DesktopUserProfile) => void;
  theme?: Theme;
}

const COLOR_OPTIONS = [
  { id: '#6366f1', label: 'Indigo', bgClass: 'bg-indigo-600', textClass: 'text-indigo-600' },
  { id: '#ec4899', label: 'Pink', bgClass: 'bg-pink-600', textClass: 'text-pink-600' },
  { id: '#10b981', label: 'Emerald', bgClass: 'bg-emerald-600', textClass: 'text-emerald-600' },
  { id: '#f59e0b', label: 'Amber', bgClass: 'bg-amber-500', textClass: 'text-amber-500' },
  { id: '#8b5cf6', label: 'Purple', bgClass: 'bg-purple-600', textClass: 'text-purple-600' },
  { id: '#3b82f6', label: 'Blue', bgClass: 'bg-blue-600', textClass: 'text-blue-600' },
  { id: '#14b8a6', label: 'Teal', bgClass: 'bg-teal-600', textClass: 'text-teal-600' },
];

export const DesktopSetupWizard: React.FC<DesktopSetupWizardProps> = ({ onComplete, theme = 'light' }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [firstName, setFirstName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'prefer_not_to_say'>('prefer_not_to_say');
  const [profileColor, setProfileColor] = useState('#6366f1');
  const [error, setError] = useState('');

  const isDark = theme === 'dark';

  const avatarInitials = getUserAvatarInitials(null, displayName || firstName || 'User');
  const effectiveName = (displayName || firstName || 'User').trim();

  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setError('Please enter your first name.');
      return;
    }
    setError('');
    setStep(3);
  };

  const handleFinishSetup = () => {
    const profile = saveDesktopUserProfile({
      firstName,
      displayName,
      gender,
      profileColor,
    });
    onComplete(profile);
  };

  return (
    <div className={`fixed inset-0 z-[9998] flex items-center justify-center p-4 select-none ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Background Soft Ambient Blur */}
      <div 
        className="absolute w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none opacity-20 transition-all duration-500"
        style={{ backgroundColor: profileColor }}
      />

      <div className={`w-full max-w-lg rounded-3xl border shadow-2xl p-6 sm:p-8 relative z-10 transition-all ${
        isDark 
          ? 'bg-slate-900/90 border-slate-800/90 shadow-slate-950/80' 
          : 'bg-white border-slate-200/90 shadow-slate-300/60'
      }`}>
        {/* Header Step Progress */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Logo iconSize={20} showText={false} />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-slate-100">
              LivePad Desktop Setup
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            {[1, 2, 3, 4].map((s) => (
              <React.Fragment key={s}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                  step === s
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : step > s
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}>
                  {step > s ? <Check size={12} /> : s}
                </span>
                {s < 4 && <span className="w-2 h-0.5 bg-slate-200 dark:bg-slate-800" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: WELCOME */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="text-center space-y-3 py-2">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                  <Sparkles size={28} />
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Welcome to LivePad Desktop
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto font-medium">
                  Your distraction-free desktop environment for real-time documents, code workspace, and offline-first team collaboration.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2 text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  <span>Privacy First & Desktop Storage</span>
                </div>
                <p className="pl-6 text-slate-500 dark:text-slate-400 leading-relaxed">
                  Your identity and document cache are preserved locally on this machine and seamlessly synchronized when joining shared rooms.
                </p>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue to Profile</span>
                <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {/* STEP 2: CREATE YOUR PROFILE */}
          {step === 2 && (
            <motion.form
              key="step2"
              onSubmit={handleStep2Next}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck size={20} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Create Your Profile</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Set up your identity for avatars, cursor labels, and real-time presence.
                </p>
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              {/* First Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>First Name <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-slate-400">Required</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Bibek"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium outline-none transition-all bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Preferred Display Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Preferred Display Name</span>
                  <span className="text-[10px] text-slate-400">Optional</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bibek (Work)"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium outline-none transition-all bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Gender Choice */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Gender</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'male', label: 'Male' },
                    { id: 'female', label: 'Female' },
                    { id: 'prefer_not_to_say', label: 'Prefer not to say' },
                  ].map((opt) => {
                    const isSelected = gender === opt.id;
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => setGender(opt.id as any)}
                        className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/70 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {isSelected && <Check size={12} className="text-indigo-600 dark:text-indigo-400" />}
                        <span className="truncate">{opt.label}</span>
                      </button>
                    );
                  })}
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

              {/* Action Buttons */}
              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft size={15} />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Preview Identity</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </motion.form>
          )}

          {/* STEP 3: PREVIEW */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={20} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Collaboration Preview</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Here is how your profile appears to teammates during live sessions.
                </p>
              </div>

              {/* Live Preview Box */}
              <div className={`p-5 rounded-2xl border space-y-4 relative overflow-hidden ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50/90 border-slate-200'
              }`}>
                {/* Simulated Collaboration Document Canvas */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 relative shadow-sm">
                  <div className="flex items-center justify-between border-b pb-2 border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-mono font-bold text-slate-400">#live-session-demo</span>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Active Collaboration
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
                    LivePad features real-time presence, multi-user document syncing, and rich markdown editing...
                  </p>

                  {/* Simulated Realtime Cursor */}
                  <div className="relative pt-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-white text-[11px] font-bold shadow-md transform -rotate-1" style={{ backgroundColor: profileColor }}>
                      <MousePointer size={12} className="fill-current" />
                      <span>{effectiveName}</span>
                    </div>
                  </div>
                </div>

                {/* Avatar Badge & Online Presence */}
                <div className="flex items-center justify-between px-2 pt-1">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full text-white font-extrabold text-sm flex items-center justify-center shadow-md relative"
                      style={{ backgroundColor: profileColor }}
                    >
                      {avatarInitials}
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {effectiveName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Ready for live sync
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                  >
                    Edit Info
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft size={15} />
                  <span>Back</span>
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue to Desktop Features</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: DESKTOP READY */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-emerald-500" />
                  <span>Desktop Capabilities Ready</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Your workspace environment is configured and ready to go.
                </p>
              </div>

              {/* Capabilities List */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { title: 'Offline Support', desc: 'Local cache & background sync queue', icon: WifiOff, color: 'text-indigo-500' },
                  { title: 'Collaboration', desc: 'Realtime cursor & live typing', icon: Users, color: 'text-emerald-500' },
                  { title: 'Cloud Sync', desc: 'Firestore room backup', icon: Cloud, color: 'text-sky-500' },
                  { title: 'Code & Notes', desc: 'Monaco editor & Markdown docs', icon: Code2, color: 'text-amber-500' },
                ].map((cap, i) => {
                  const Icon = cap.icon;
                  return (
                    <div 
                      key={i}
                      className={`p-3 rounded-2xl border flex flex-col justify-between space-y-1 ${
                        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={16} className={cap.color} />
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{cap.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 leading-tight">{cap.desc}</span>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft size={15} />
                  <span>Back</span>
                </button>
                <button
                  onClick={handleFinishSetup}
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Launch LivePad Desktop</span>
                  <Check size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
