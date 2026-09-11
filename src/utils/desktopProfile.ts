import { db, ensureAuth, isFirestoreQuotaExhausted, markQuotaExhausted } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface DesktopUserProfile {
  firstName: string;
  displayName?: string;
  gender: 'male' | 'female' | 'prefer_not_to_say';
  profileColor?: string;
  avatarUrl?: string;
  setupCompleted: boolean;
  createdAt: number;
  updatedAt: number;
}

const PROFILE_STORAGE_KEY = 'livepad_desktop_user_profile';
const USERNAME_STORAGE_KEY = 'livepad_username';

export function getDesktopUserProfile(): DesktopUserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DesktopUserProfile;
  } catch (err) {
    console.error('Failed to parse desktop user profile:', err);
    return null;
  }
}

export function hasCompletedDesktopSetup(): boolean {
  const profile = getDesktopUserProfile();
  return Boolean(profile && profile.setupCompleted && profile.firstName.trim().length > 0);
}

export async function syncProfileToFirestore(profileData?: DesktopUserProfile | null): Promise<void> {
  const profile = profileData || getDesktopUserProfile();
  if (!profile || isFirestoreQuotaExhausted()) return;

  try {
    const user = await ensureAuth();
    if (!user || !db || isFirestoreQuotaExhausted()) return;

    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(
      userDocRef,
      {
        uid: user.uid,
        name: profile.firstName,
        firstName: profile.firstName,
        displayName: profile.displayName || profile.firstName,
        gender: profile.gender || 'prefer_not_to_say',
        photoURL: profile.avatarUrl || '',
        updatedAt: serverTimestamp(),
        createdAt: profile.createdAt ? new Date(profile.createdAt) : serverTimestamp(),
      },
      { merge: true }
    );
    console.log(`[syncProfileToFirestore] Successfully synced profile for UID: ${user.uid}`);
  } catch (err) {
    if (String(err).includes('resource-exhausted') || String(err).includes('Quota')) {
      markQuotaExhausted();
    } else {
      console.warn('Failed to sync user profile to Firestore:', err);
    }
  }
}

export function saveDesktopUserProfile(
  profileData: Partial<DesktopUserProfile> & { firstName: string; gender: 'male' | 'female' | 'prefer_not_to_say' }
): DesktopUserProfile {
  const existing = getDesktopUserProfile();
  const now = Date.now();

  const updatedProfile: DesktopUserProfile = {
    firstName: profileData.firstName.trim(),
    displayName: profileData.displayName?.trim() || '',
    gender: profileData.gender || 'prefer_not_to_say',
    profileColor: profileData.profileColor || existing?.profileColor || '#6366f1',
    avatarUrl: profileData.avatarUrl || existing?.avatarUrl || '',
    setupCompleted: true,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
    
    // Sync collaboration identity key used across LivePad
    const effectiveName = updatedProfile.displayName || updatedProfile.firstName;
    localStorage.setItem(USERNAME_STORAGE_KEY, effectiveName);

    // Asynchronously push to Firestore users/{uid}
    syncProfileToFirestore(updatedProfile).catch((err) => {
      console.warn('Background Firestore profile sync error:', err);
    });
  } catch (err) {
    console.error('Failed to save desktop user profile:', err);
  }

  return updatedProfile;
}

export function getUserAvatarInitials(profile: DesktopUserProfile | null, fallbackName: string = ''): string {
  const name = profile?.firstName || profile?.displayName || fallbackName || 'User';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

