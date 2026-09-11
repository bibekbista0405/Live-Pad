import React, { createContext, useContext, useMemo } from 'react';
import { WorkspaceRole } from '../types';
import { WorkspacePermissionService } from '../services/WorkspacePermissionService';

export interface PermissionContextType {
  role: WorkspaceRole;
  isOwner: boolean;
  isAdmin: boolean;
  canEdit: () => boolean;
  canDelete: (targetType?: 'workspace' | 'comment' | 'message' | 'file') => boolean;
  canInvite: () => boolean;
  canCreateProject: () => boolean;
  canManageUsers: () => boolean;
  canAccessAdmin: () => boolean;
  canArchive: () => boolean;
  canDeleteWorkspace: () => boolean;
  canTransferOwnership: () => boolean;
  canManageRoles: () => boolean;
  canExport: () => boolean;
  canImport: () => boolean;
}

export const PermissionContext = createContext<PermissionContextType | null>(null);

interface PermissionProviderProps {
  role: WorkspaceRole;
  children: React.ReactNode;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ role, children }) => {
  const value = useMemo<PermissionContextType>(() => {
    return {
      role,
      isOwner: role === 'owner',
      isAdmin: role === 'owner' || role === 'admin',
      canEdit: () => WorkspacePermissionService.canEdit(role),
      canDelete: (targetType) => WorkspacePermissionService.canDelete(role, targetType),
      canInvite: () => WorkspacePermissionService.canInvite(role),
      canCreateProject: () => WorkspacePermissionService.canCreateProject(role),
      canManageUsers: () => WorkspacePermissionService.canManageUsers(role),
      canAccessAdmin: () => WorkspacePermissionService.canAccessAdmin(role),
      canArchive: () => WorkspacePermissionService.canArchive(role),
      canDeleteWorkspace: () => WorkspacePermissionService.canDeleteWorkspace(role),
      canTransferOwnership: () => WorkspacePermissionService.canTransferOwnership(role),
      canManageRoles: () => WorkspacePermissionService.canManageRoles(role),
      canExport: () => WorkspacePermissionService.canExport(role),
      canImport: () => WorkspacePermissionService.canImport(role),
    };
  }, [role]);

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
};

export const usePermission = (): PermissionContextType => {
  const context = useContext(PermissionContext);
  if (!context) {
    const fallbackRole: WorkspaceRole = 'guest';
    return {
      role: fallbackRole,
      isOwner: false,
      isAdmin: false,
      canEdit: () => false,
      canDelete: () => false,
      canInvite: () => false,
      canCreateProject: () => false,
      canManageUsers: () => false,
      canAccessAdmin: () => false,
      canArchive: () => false,
      canDeleteWorkspace: () => false,
      canTransferOwnership: () => false,
      canManageRoles: () => false,
      canExport: () => true,
      canImport: () => false,
    };
  }
  return context;
};
