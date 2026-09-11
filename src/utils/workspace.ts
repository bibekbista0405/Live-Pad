import { 
  WorkspaceType, 
  WorkspaceRole, 
  WorkspaceStatus, 
  WorkspacePrivacy, 
  WorkspacePermissions 
} from '../types';

export interface WorkspaceTypeDefinition {
  type: WorkspaceType;
  title: string;
  description: string;
  icon: string;
  creatorRole: WorkspaceRole;
  participantRole: WorkspaceRole;
  defaultLimit: number;
}

export const WORKSPACE_TYPES: Record<WorkspaceType, WorkspaceTypeDefinition> = {
  teaching: {
    type: 'teaching',
    title: 'Teaching Session',
    description: 'Instructor-led session with teacher and student permissions.',
    icon: '📚',
    creatorRole: 'teacher',
    participantRole: 'student',
    defaultLimit: 50
  },
  study: {
    type: 'study',
    title: 'Study Group',
    description: 'Collaborative peer group for shared notes and drafting.',
    icon: '👥',
    creatorRole: 'owner',
    participantRole: 'collaborator',
    defaultLimit: 20
  },
  coding: {
    type: 'coding',
    title: 'Coding Session',
    description: 'Interactive pair/group programming and playground.',
    icon: '💻',
    creatorRole: 'instructor',
    participantRole: 'learner',
    defaultLimit: 25
  },
  personal: {
    type: 'personal',
    title: 'Personal Workspace',
    description: 'Private workspace with optional invite sharing.',
    icon: '📝',
    creatorRole: 'owner',
    participantRole: 'member',
    defaultLimit: 5
  },
  team: {
    type: 'team',
    title: 'Team Collaboration',
    description: 'Project workspace with admin management and members.',
    icon: '🏢',
    creatorRole: 'admin',
    participantRole: 'member',
    defaultLimit: 30
  }
};

/**
 * Generate a secure, unique, human-readable room code.
 * Format: LP-7XK9-MQ2P
 */
export function generateRoomCode(): string {
  // Exclude easily confused characters (I, O, 0, 1) for better readability
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let segment1 = '';
  let segment2 = '';

  for (let i = 0; i < 4; i++) {
    segment1 += chars.charAt(Math.floor(Math.random() * chars.length));
    segment2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `LP-${segment1}-${segment2}`;
}

/**
 * Normalizes input text into a standard room code format.
 * Examples:
 *   "7xk9mq2p" -> "LP-7XK9-MQ2P"
 *   "lp-7xk9-mq2p" -> "LP-7XK9-MQ2P"
 *   "note88" -> "NOTE88"
 */
export function normalizeRoomCode(input: string): string {
  if (!input) return '';
  const trimmed = input.trim().toUpperCase();

  // If input is a full URL or string containing LP-XXXX-XXXX format
  const lpMatch = trimmed.match(/LP-[A-Z0-9]{4}-[A-Z0-9]{4}/i);
  if (lpMatch) {
    return lpMatch[0].toUpperCase();
  }

  // Strip prefix if already starts with LP-
  const cleanStr = trimmed.replace(/^LP-?/i, '').replace(/[^A-Z0-9]/g, '');

  // If it's an 8-character code, reformat to LP-XXXX-XXXX
  if (cleanStr.length === 8) {
    return `LP-${cleanStr.substring(0, 4)}-${cleanStr.substring(4)}`;
  }

  // If already matches LP-XXXX-XXXX
  if (/^LP-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(trimmed)) {
    return trimmed;
  }

  // Fallback for legacy alphanumeric codes (4-16 chars)
  return trimmed;
}

/**
 * Validates format of a room code.
 */
export function validateRoomCodeFormat(code: string): { valid: boolean; message?: string; cleanCode: string } {
  const normalized = normalizeRoomCode(code);
  if (!normalized) {
    return { valid: false, message: 'Please enter a room code.', cleanCode: '' };
  }

  // Check against format rules: LP-XXXX-XXXX or alphanumeric 4-16 chars
  const isLPFormat = /^LP-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalized);
  const isLegacyFormat = /^[A-Z0-9]{4,16}$/.test(normalized);

  if (!isLPFormat && !isLegacyFormat) {
    return { 
      valid: false, 
      message: 'Invalid room code format. Expected format: LP-XXXX-XXXX or a valid 4 to 16 alphanumeric code.', 
      cleanCode: normalized 
    };
  }

  return { valid: true, cleanCode: normalized };
}

/**
 * Returns default permissions for a workspace.
 */
export function getDefaultPermissions(workspaceType: WorkspaceType): WorkspacePermissions {
  return {
    allowGuestEdit: true,
    allowChat: true,
    allowExport: true
  };
}

export const ROOM_LABELS = [
  { name: 'Meeting', bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', dotBg: 'bg-emerald-500' },
  { name: 'Lecture', bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', dotBg: 'bg-blue-500' },
  { name: 'Drafting', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', dotBg: 'bg-amber-500' },
  { name: 'Coding', bg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20', dotBg: 'bg-violet-500' },
  { name: 'Research', bg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20', dotBg: 'bg-cyan-500' },
];
