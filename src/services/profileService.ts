import { Platform } from '../platform';

export interface WorkspaceProfile {
  id: string;
  name: string;
  icon: string;
  theme: string;
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: 'on' | 'off' | 'bounded';
  minimap: boolean;
  formatOnSave: boolean;
  installedExtensions: string[];
  terminalShell: string;
  aiModel: string;
}

export const DEFAULT_PROFILES: WorkspaceProfile[] = [
  {
    id: 'default',
    name: 'Standard IDE',
    icon: 'code',
    theme: 'vs-dark',
    fontSize: 14,
    fontFamily: "'Cascadia Code', 'Fira Code', 'Courier New', monospace",
    tabSize: 2,
    wordWrap: 'on',
    minimap: true,
    formatOnSave: true,
    installedExtensions: ['typescript', 'python', 'git-lens', 'prettier'],
    terminalShell: 'default',
    aiModel: 'gemini-2.5-flash',
  },
  {
    id: 'frontend',
    name: 'Frontend Developer',
    icon: 'layout',
    theme: 'vs-dark',
    fontSize: 15,
    fontFamily: "'Fira Code', monospace",
    tabSize: 2,
    wordWrap: 'on',
    minimap: true,
    formatOnSave: true,
    installedExtensions: ['typescript', 'react-snippets', 'tailwindcss-intellisense'],
    terminalShell: 'default',
    aiModel: 'gemini-2.5-flash',
  },
  {
    id: 'python-data',
    name: 'Python & Data Science',
    icon: 'terminal',
    theme: 'vs-dark',
    fontSize: 14,
    fontFamily: "'JetBrains Mono', monospace",
    tabSize: 4,
    wordWrap: 'off',
    minimap: false,
    formatOnSave: true,
    installedExtensions: ['python', 'jupyter', 'pylance'],
    terminalShell: 'default',
    aiModel: 'gemini-2.5-flash',
  },
];

export class ProfileService {
  private static instance: ProfileService;
  private activeProfile: WorkspaceProfile = DEFAULT_PROFILES[0];
  private profiles: WorkspaceProfile[] = [...DEFAULT_PROFILES];

  public static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  public async init() {
    try {
      const storedProfiles = await Platform.getNativeStorage('livepad_profiles');
      if (storedProfiles && Array.isArray(storedProfiles)) {
        this.profiles = storedProfiles;
      }
      const activeId = await Platform.getNativeStorage('livepad_active_profile');
      if (activeId) {
        const found = this.profiles.find((p) => p.id === activeId);
        if (found) this.activeProfile = found;
      }
    } catch {
      // Use defaults
    }
  }

  public getActiveProfile(): WorkspaceProfile {
    return this.activeProfile;
  }

  public getProfiles(): WorkspaceProfile[] {
    return this.profiles;
  }

  public async switchProfile(profileId: string): Promise<WorkspaceProfile> {
    const target = this.profiles.find((p) => p.id === profileId);
    if (!target) throw new Error(`Profile ${profileId} not found`);

    this.activeProfile = target;
    await Platform.setNativeStorage('livepad_active_profile', profileId);
    return this.activeProfile;
  }

  public async saveProfile(profile: WorkspaceProfile): Promise<void> {
    const idx = this.profiles.findIndex((p) => p.id === profile.id);
    if (idx >= 0) {
      this.profiles[idx] = profile;
    } else {
      this.profiles.push(profile);
    }

    if (this.activeProfile.id === profile.id) {
      this.activeProfile = profile;
    }

    await Platform.setNativeStorage('livepad_profiles', this.profiles);
  }
}

export const profileService = ProfileService.getInstance();
