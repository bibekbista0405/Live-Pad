/**
 * LivePad V2 foundation permission vocabulary.
 *
 * This module is intentionally pure: it is safe to use from UI code and tests,
 * but it is NOT the security boundary. Firestore Rules/server APIs remain authoritative.
 */
export const PERMISSIONS = {
  workspaceRead: 'workspace.read',
  workspaceEdit: 'workspace.edit',
  workspaceDelete: 'workspace.delete',
  membersInvite: 'members.invite',
  membersManage: 'members.manage',
  documentRead: 'document.read',
  documentEdit: 'document.edit',
  documentComment: 'document.comment',
  documentExport: 'document.export',
  projectRead: 'project.read',
  projectEdit: 'project.edit',
  projectDelete: 'project.delete',
  terminalExecute: 'terminal.execute',
  gitWrite: 'git.write',
  aiUse: 'ai.use',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export type FoundationRole = 'owner' | 'admin' | 'editor' | 'commenter' | 'viewer' | 'guest';

const rolePermissions: Record<FoundationRole, readonly Permission[]> = {
  owner: Object.values(PERMISSIONS),
  admin: [
    PERMISSIONS.workspaceRead, PERMISSIONS.workspaceEdit,
    PERMISSIONS.membersInvite, PERMISSIONS.membersManage,
    PERMISSIONS.documentRead, PERMISSIONS.documentEdit, PERMISSIONS.documentComment, PERMISSIONS.documentExport,
    PERMISSIONS.projectRead, PERMISSIONS.projectEdit, PERMISSIONS.projectDelete,
    PERMISSIONS.terminalExecute, PERMISSIONS.gitWrite, PERMISSIONS.aiUse,
  ],
  editor: [
    PERMISSIONS.workspaceRead, PERMISSIONS.documentRead, PERMISSIONS.documentEdit, PERMISSIONS.documentComment,
    PERMISSIONS.documentExport, PERMISSIONS.projectRead, PERMISSIONS.projectEdit, PERMISSIONS.terminalExecute,
    PERMISSIONS.gitWrite, PERMISSIONS.aiUse,
  ],
  commenter: [PERMISSIONS.workspaceRead, PERMISSIONS.documentRead, PERMISSIONS.documentComment, PERMISSIONS.documentExport, PERMISSIONS.aiUse],
  viewer: [PERMISSIONS.workspaceRead, PERMISSIONS.documentRead, PERMISSIONS.documentExport],
  guest: [PERMISSIONS.workspaceRead, PERMISSIONS.documentRead],
};

export function hasPermission(role: FoundationRole, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}

export function permissionsFor(role: FoundationRole): readonly Permission[] {
  return rolePermissions[role];
}
