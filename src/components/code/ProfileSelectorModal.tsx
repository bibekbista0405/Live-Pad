import React, { useState, useEffect } from 'react';
import { X, Check, Sliders, Palette, Terminal, Sparkles, CheckCircle2 } from 'lucide-react';
import { profileService, WorkspaceProfile } from '../../services/profileService';

interface ProfileSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileChanged?: (profile: WorkspaceProfile) => void;
}

export function ProfileSelectorModal({ isOpen, onClose, onProfileChanged }: ProfileSelectorModalProps) {
  const [profiles, setProfiles] = useState<WorkspaceProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<WorkspaceProfile | null>(null);

  useEffect(() => {
    if (isOpen) {
      profileService.init().then(() => {
        setProfiles(profileService.getProfiles());
        setActiveProfile(profileService.getActiveProfile());
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = async (profileId: string) => {
    const p = await profileService.switchProfile(profileId);
    setActiveProfile(p);
    if (onProfileChanged) onProfileChanged(p);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-[#252526] border-b border-[#2d2d2d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#007acc]" />
            <h2 className="font-bold text-white text-base">Workspace Profiles</h2>
          </div>
          <button onClick={onClose} className="p-1 text-[#858585] hover:text-white rounded hover:bg-[#333333]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Profiles */}
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {profiles.map((p) => {
            const isSelected = activeProfile?.id === p.id;
            return (
              <div
                key={p.id}
                onClick={() => handleSelect(p.id)}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#007acc]/10 border-[#007acc] text-white shadow-md'
                    : 'bg-[#252526] border-[#333333] hover:border-[#444444] text-slate-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-white">
                    <span>{p.name}</span>
                    {isSelected && <span className="text-[10px] bg-[#007acc] text-white px-2 py-0.5 rounded-full font-normal">Active</span>}
                  </div>
                  <div className="text-xs text-[#858585] flex items-center gap-3">
                    <span className="flex items-center gap-1"><Palette className="w-3 h-3"/> {p.theme}</span>
                    <span className="flex items-center gap-1"><Terminal className="w-3 h-3"/> Font {p.fontSize}px</span>
                    <span className="flex items-center gap-1"><Sparkles className="w-3 h-3"/> {p.aiModel}</span>
                  </div>
                </div>

                {isSelected && <CheckCircle2 className="w-5 h-5 text-[#007acc]" />}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#252526] border-t border-[#2d2d2d] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#007acc] hover:bg-[#0062a3] text-white font-semibold rounded text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
