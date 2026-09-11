/**
 * LivePad Workspace Categories & Dynamic Role-Based Architecture
 */

export type GlobalSystemRole = 'admin' | 'user';

export type WorkspaceCategory = 'teaching' | 'study' | 'coding' | 'personal' | 'team';

// Category 1: Teaching Session Roles
export type TeachingRole = 'teacher' | 'assistant_teacher' | 'student' | 'viewer';

// Category 2: Study Group Roles
export type StudyRole = 'group_leader' | 'member' | 'guest';

// Category 3: Coding Session Roles
export type CodingRole = 'instructor' | 'developer' | 'reviewer' | 'observer';

// Category 4: Personal Workspace Roles
export type PersonalRole = 'owner' | 'guest';

// Category 5: Team Collaboration Roles
export type TeamRole = 'manager' | 'editor' | 'contributor' | 'viewer';

export type AnyWorkspaceRole = 
  | TeachingRole 
  | StudyRole 
  | CodingRole 
  | PersonalRole 
  | TeamRole;

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  badgeColor: string;
  isOwner?: boolean;
  capabilities: string[];
}

export interface CategoryDefinition {
  id: WorkspaceCategory;
  name: string;
  emoji: string;
  tagline: string;
  purpose: string;
  ownerRole: AnyWorkspaceRole;
  defaultRole: AnyWorkspaceRole;
  defaultLimit: number;
  roles: RoleDefinition[];
  defaultVisibility: 'public' | 'private' | 'invite-only';
  features: {
    showAttendance?: boolean;
    showStudentList?: boolean;
    showTeacherControls?: boolean;
    showPresentationMode?: boolean;
    showClassChat?: boolean;
    showSharedNotes?: boolean;
    showTasks?: boolean;
    showDiscussion?: boolean;
    showCodeMode?: boolean;
    showTerminal?: boolean;
    showPreview?: boolean;
    showGitPanel?: boolean;
    showDebugger?: boolean;
    showParticipants?: boolean;
    showChat?: boolean;
    showPresence?: boolean;
    showRoleManagement?: boolean;
    showProjects?: boolean;
    showActivity?: boolean;
    showFileVault?: boolean;
  };
}

export const CATEGORY_DEFINITIONS: Record<WorkspaceCategory, CategoryDefinition> = {
  teaching: {
    id: 'teaching',
    name: 'Teaching Session',
    emoji: '📚',
    tagline: 'Teacher leads, students learn and submit work',
    purpose: 'Instructor-led classroom or workshop experience with granular student moderation and presentation tools.',
    ownerRole: 'teacher',
    defaultRole: 'student',
    defaultLimit: 100,
    defaultVisibility: 'public',
    roles: [
      {
        id: 'teacher',
        name: 'Teacher (Owner)',
        description: 'Full classroom control, presentation mode, mute students, start quizzes, lock editing.',
        badgeColor: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
        isOwner: true,
        capabilities: [
          'Manage & remove students',
          'Mute/Unmute participants',
          'Share resources & presentation mode',
          'Control Code Mode',
          'Start quizzes & live polls',
          'Lock/Unlock document editing',
          'Grant speaking & edit permissions',
          'Track student attendance',
          'Archive or delete workspace'
        ]
      },
      {
        id: 'assistant_teacher',
        name: 'Assistant Teacher',
        description: 'Assists moderation, handles class chat, helps students.',
        badgeColor: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
        capabilities: [
          'Moderate class chat',
          'Assist students & answer hand-raises',
          'Help run live quizzes',
          'Share supplementary files',
          'Cannot delete workspace'
        ]
      },
      {
        id: 'student',
        name: 'Student',
        description: 'Edits assigned documents, submits work, raises hand.',
        badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        capabilities: [
          'Edit assigned sections/docs',
          'Submit coursework',
          'Participate in class chat',
          'Raise hand for assistance',
          'Respond to live quizzes'
        ]
      },
      {
        id: 'viewer',
        name: 'Viewer',
        description: 'Watch-only, read-only observer mode.',
        badgeColor: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
        capabilities: [
          'Watch live presentation',
          'Read-only document access',
          'Cannot edit or send chat messages'
        ]
      }
    ],
    features: {
      showAttendance: true,
      showStudentList: true,
      showTeacherControls: true,
      showPresentationMode: true,
      showClassChat: true,
      showParticipants: true,
      showChat: true,
      showPresence: true,
      showRoleManagement: true,
      showSharedNotes: true,
      showFileVault: true
    }
  },

  study: {
    id: 'study',
    name: 'Study Group',
    emoji: '👨‍🎓',
    tagline: 'Peer-to-peer equal collaboration and task management',
    purpose: 'Collaborative group study space for shared drafting, task division, and resource sharing.',
    ownerRole: 'group_leader',
    defaultRole: 'member',
    defaultLimit: 30,
    defaultVisibility: 'public',
    roles: [
      {
        id: 'group_leader',
        name: 'Group Leader',
        description: 'Manages group members, assigns tasks, updates settings.',
        badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
        isOwner: true,
        capabilities: [
          'Manage group members & invite links',
          'Rename workspace & update settings',
          'Assign study tasks & deadlines',
          'Manage permissions & archive group'
        ]
      },
      {
        id: 'member',
        name: 'Member',
        description: 'Full collaborative editing, task creation, chat, and file uploads.',
        badgeColor: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30',
        capabilities: [
          'Edit shared notes & documents',
          'Comment & join study discussions',
          'Create & check off tasks',
          'Upload study materials & files'
        ]
      },
      {
        id: 'guest',
        name: 'Guest',
        description: 'Read and comment mode unless explicitly granted edit access.',
        badgeColor: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
        capabilities: [
          'Read study documents',
          'Add comments & feedback',
          'Cannot modify shared notes directly unless permitted'
        ]
      }
    ],
    features: {
      showSharedNotes: true,
      showTasks: true,
      showDiscussion: true,
      showParticipants: true,
      showChat: true,
      showPresence: true,
      showRoleManagement: true,
      showFileVault: true
    }
  },

  coding: {
    id: 'coding',
    name: 'Coding Session',
    emoji: '💻',
    tagline: 'Pair programming, code execution, terminal & version history',
    purpose: 'Collaborative code studio with syntax highlighting, live terminal output, git snapshots, and code review.',
    ownerRole: 'instructor',
    defaultRole: 'developer',
    defaultLimit: 25,
    defaultVisibility: 'public',
    roles: [
      {
        id: 'instructor',
        name: 'Instructor',
        description: 'Controls project setup, code execution, terminal sharing, and code sync.',
        badgeColor: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
        isOwner: true,
        capabilities: [
          'Manage project architecture',
          'Run code & view console terminal',
          'Share & sync code across clients',
          'Assign coding challenges & tasks',
          'Approve pull requests & version commits'
        ]
      },
      {
        id: 'developer',
        name: 'Developer',
        description: 'Writes code, runs scripts, debugs, and commits version changes.',
        badgeColor: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
        capabilities: [
          'Write & edit source code in Monaco Editor',
          'Run code & view execution logs',
          'Debug errors & inspect outputs',
          'Create version snapshot commits'
        ]
      },
      {
        id: 'reviewer',
        name: 'Reviewer',
        description: 'Reviews code, leaves comments, approves changes without directly editing protected files.',
        badgeColor: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
        capabilities: [
          'Inline code review comments',
          'Approve or request changes on commits',
          'Read-only on core protected files'
        ]
      },
      {
        id: 'observer',
        name: 'Observer',
        description: 'View-only access to code workspace and execution terminal.',
        badgeColor: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
        capabilities: [
          'Live view of code editor and output',
          'Cannot modify code or run commands'
        ]
      }
    ],
    features: {
      showCodeMode: true,
      showTerminal: true,
      showPreview: true,
      showGitPanel: true,
      showDebugger: true,
      showParticipants: true,
      showChat: true,
      showPresence: true,
      showRoleManagement: true
    }
  },

  personal: {
    id: 'personal',
    name: 'Personal Workspace',
    emoji: '📝',
    tagline: 'Distraction-free personal notebook with optional view sharing',
    purpose: 'Private, clean productivity environment focused purely on writing, tagging, and document organization.',
    ownerRole: 'owner',
    defaultRole: 'guest',
    defaultLimit: 5,
    defaultVisibility: 'private',
    roles: [
      {
        id: 'owner',
        name: 'Owner',
        description: 'Complete private ownership and customization.',
        badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        isOwner: true,
        capabilities: [
          'Complete document control',
          'Custom formatting, outline, & export',
          'Optional read-only link sharing',
          'Local & Cloud auto-sync'
        ]
      },
      {
        id: 'guest',
        name: 'Guest',
        description: 'Read-only access when shared by owner.',
        badgeColor: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
        capabilities: [
          'Read-only view',
          'No collaborative editing or chat permissions by default'
        ]
      }
    ],
    features: {
      // Intentionally hide social/collaborative panels for distraction-free focus!
      showParticipants: false,
      showChat: false,
      showPresence: false,
      showRoleManagement: false,
      showSharedNotes: true,
      showFileVault: true
    }
  },

  team: {
    id: 'team',
    name: 'Team Collaboration',
    emoji: '👥',
    tagline: 'Structured business projects, folder hierarchies, and activity audit',
    purpose: 'Professional team workspace for multi-document projects, task workflows, and team role permissions.',
    ownerRole: 'manager',
    defaultRole: 'editor',
    defaultLimit: 50,
    defaultVisibility: 'invite-only',
    roles: [
      {
        id: 'manager',
        name: 'Manager',
        description: 'Manages team members, project folders, workspace settings, and tasks.',
        badgeColor: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
        isOwner: true,
        capabilities: [
          'Manage team members & roles',
          'Create folders & project trees',
          'Assign project tasks & milestones',
          'Manage workspace settings & security',
          'Archive workspace'
        ]
      },
      {
        id: 'editor',
        name: 'Editor',
        description: 'Edits all documents, comments, uploads files, updates tasks.',
        badgeColor: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
        capabilities: [
          'Edit all team documents & notes',
          'Create & upload project assets',
          'Comment & participate in team chat',
          'Manage task progress'
        ]
      },
      {
        id: 'contributor',
        name: 'Contributor',
        description: 'Limited editing and task contribution, cannot manage members or folders.',
        badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
        capabilities: [
          'Edit assigned documents',
          'Update task status',
          'Comment on team items'
        ]
      },
      {
        id: 'viewer',
        name: 'Viewer',
        description: 'Read-only access to team files and project activity.',
        badgeColor: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
        capabilities: [
          'View project documents & folders',
          'View team activity feed',
          'Cannot edit or delete items'
        ]
      }
    ],
    features: {
      showProjects: true,
      showTasks: true,
      showActivity: true,
      showParticipants: true,
      showChat: true,
      showPresence: true,
      showRoleManagement: true,
      showFileVault: true,
      showSharedNotes: true
    }
  }
};

/**
 * Validates whether a specific role in a workspace category can perform a specific action.
 */
export function canPerformAction(
  category: WorkspaceCategory,
  role: string,
  action: string,
  context?: { editingLocked?: boolean; isAssignedDoc?: boolean }
): boolean {
  // Global Platform Administrator override
  if (role === 'admin') return true;

  const catDef = CATEGORY_DEFINITIONS[category];
  if (!catDef) return false;

  switch (action) {
    case 'edit_document': {
      if (context?.editingLocked && role !== 'teacher' && role !== 'group_leader' && role !== 'instructor' && role !== 'owner' && role !== 'manager') {
        return false;
      }
      if (category === 'teaching') {
        return role === 'teacher' || role === 'assistant_teacher' || role === 'student';
      }
      if (category === 'study') {
        return role === 'group_leader' || role === 'member';
      }
      if (category === 'coding') {
        return role === 'instructor' || role === 'developer';
      }
      if (category === 'personal') {
        return role === 'owner';
      }
      if (category === 'team') {
        return role === 'manager' || role === 'editor' || role === 'contributor';
      }
      return false;
    }

    case 'manage_members':
    case 'invite_users':
    case 'change_role':
    case 'remove_user': {
      if (category === 'teaching') return role === 'teacher';
      if (category === 'study') return role === 'group_leader';
      if (category === 'coding') return role === 'instructor';
      if (category === 'personal') return role === 'owner';
      if (category === 'team') return role === 'manager';
      return false;
    }

    case 'teacher_controls':
    case 'mute_students':
    case 'start_quiz':
    case 'lock_editing':
    case 'grant_speaking': {
      if (category === 'teaching') return role === 'teacher' || (action === 'start_quiz' && role === 'assistant_teacher');
      return false;
    }

    case 'run_code':
    case 'sync_code': {
      if (category === 'coding') {
        if (action === 'sync_code') return role === 'instructor';
        return role === 'instructor' || role === 'developer';
      }
      return true; // standard code mode in other categories
    }

    case 'commit_code':
    case 'approve_code': {
      if (category === 'coding') {
        if (action === 'approve_code') return role === 'instructor' || role === 'reviewer';
        return role === 'instructor' || role === 'developer';
      }
      return true;
    }

    case 'manage_tasks': {
      if (category === 'study') return role === 'group_leader' || role === 'member';
      if (category === 'team') return role === 'manager' || role === 'editor';
      return role === 'teacher' || role === 'instructor' || role === 'owner';
    }

    case 'archive_workspace':
    case 'delete_workspace':
    case 'rename_workspace': {
      if (category === 'teaching') return role === 'teacher';
      if (category === 'study') return role === 'group_leader';
      if (category === 'coding') return role === 'instructor';
      if (category === 'personal') return role === 'owner';
      if (category === 'team') return role === 'manager';
      return false;
    }

    case 'upload_files': {
      if (category === 'teaching') return role === 'teacher' || role === 'assistant_teacher' || role === 'student';
      if (category === 'study') return role === 'group_leader' || role === 'member';
      if (category === 'coding') return role === 'instructor' || role === 'developer';
      if (category === 'personal') return role === 'owner';
      if (category === 'team') return role === 'manager' || role === 'editor';
      return false;
    }

    case 'send_chat': {
      if (category === 'teaching') return role === 'teacher' || role === 'assistant_teacher' || role === 'student';
      if (category === 'personal') return false;
      return role !== 'viewer' && role !== 'observer' && role !== 'guest';
    }

    default:
      return true;
  }
}

/**
 * Returns human readable name for any workspace role.
 */
export function getRoleDisplayName(role: string): string {
  const map: Record<string, string> = {
    teacher: 'Teacher (Owner)',
    assistant_teacher: 'Assistant Teacher',
    student: 'Student',
    viewer: 'Viewer',
    group_leader: 'Group Leader',
    member: 'Member',
    guest: 'Guest',
    instructor: 'Instructor',
    developer: 'Developer',
    reviewer: 'Reviewer',
    observer: 'Observer',
    owner: 'Owner',
    manager: 'Manager',
    editor: 'Editor',
    contributor: 'Contributor',
    admin: 'Administrator',
    collaborator: 'Collaborator',
    commenter: 'Commenter',
    learner: 'Learner'
  };
  return map[role] || role;
}
