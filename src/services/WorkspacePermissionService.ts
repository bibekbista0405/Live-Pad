import { WorkspaceRole } from '../types';

/**
 * WorkspacePermissionService
 * Single source of truth for Role-Based Access Control (RBAC) permissions.
 */
export class WorkspacePermissionService {
  static canAccessAdmin(role: WorkspaceRole): boolean {
    return role === 'owner' || role === 'admin';
  }

  static canManageRoles(role: WorkspaceRole): boolean {
    return role === 'owner';
  }

  static canManageUsers(role: WorkspaceRole): boolean {
    return role === 'owner' || role === 'admin';
  }

  static canDeleteWorkspace(role: WorkspaceRole): boolean {
    return role === 'owner';
  }

  static canArchive(role: WorkspaceRole): boolean {
    return role === 'owner';
  }

  static canTransferOwnership(role: WorkspaceRole): boolean {
    return role === 'owner';
  }

  static canCreateProject(role: WorkspaceRole): boolean {
    return ['owner', 'admin', 'editor'].includes(role);
  }

  static canEdit(role: WorkspaceRole): boolean {
    return ['owner', 'admin', 'editor'].includes(role);
  }

  static canDelete(
    role: WorkspaceRole,
    targetType?: 'workspace' | 'comment' | 'message' | 'file'
  ): boolean {
    if (targetType === 'workspace') return role === 'owner';
    if (targetType === 'comment' || targetType === 'message') {
      return ['owner', 'admin', 'moderator'].includes(role);
    }
    return ['owner', 'admin'].includes(role);
  }

  static canInvite(role: WorkspaceRole): boolean {
    return ['owner', 'admin', 'editor'].includes(role);
  }

  static canExport(role: WorkspaceRole): boolean {
    return ['owner', 'admin', 'editor', 'commenter', 'viewer'].includes(role);
  }

  static canImport(role: WorkspaceRole): boolean {
    return ['owner', 'admin', 'editor'].includes(role);
  }

  static getRoleBadgeColor(role: WorkspaceRole): string {
    switch (role) {
      case 'owner':
        return 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'admin':
        return 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'moderator':
        return 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30';
      case 'editor':
        return 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30';
      case 'commenter':
        return 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30';
      case 'viewer':
        return 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30';
      case 'guest':
      default:
        return 'bg-zinc-500/20 text-zinc-600 dark:text-zinc-400 border-zinc-500/30';
    }
  }

  static getRoleDisplayName(role: WorkspaceRole): string {
    switch (role) {
      case 'owner':
        return 'Workspace Owner 👑';
      case 'admin':
        return 'Administrator 🛡️';
      case 'moderator':
        return 'Moderator ⚖️';
      case 'editor':
        return 'Editor ✍️';
      case 'commenter':
        return 'Commenter 💬';
      case 'viewer':
        return 'Viewer 👁️';
      case 'guest':
        return 'Guest User 👤';
      default:
        return 'Member';
    }
  }
}
