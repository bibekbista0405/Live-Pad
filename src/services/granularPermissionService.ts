import { GranularRole, PermissionMatrix, AuditLogEntry } from '../types/phase4';
import { Platform } from '../platform';

export class GranularPermissionService {
  private static instance: GranularPermissionService;
  private currentRole: GranularRole = 'owner';
  private auditLogs: AuditLogEntry[] = [];

  public static getInstance(): GranularPermissionService {
    if (!GranularPermissionService.instance) {
      GranularPermissionService.instance = new GranularPermissionService();
      GranularPermissionService.instance.initAuditLogs();
    }
    return GranularPermissionService.instance;
  }

  private initAuditLogs() {
    this.auditLogs = [
      {
        id: 'audit-1',
        timestamp: Date.now() - 3600000,
        actor: 'sarah.chen@livepad.dev',
        actorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        action: 'Updated workspace security settings & 2FA policy',
        category: 'security',
        details: 'Enforced required two-factor authentication for all Developer role members.',
        ipAddress: '192.168.1.102',
      },
      {
        id: 'audit-2',
        timestamp: Date.now() - 7200000,
        actor: 'alex.rivera@livepad.dev',
        actorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        action: 'Promoted user devon.vance@livepad.dev to Developer role',
        category: 'member',
        details: 'Granted write access to git repositories and terminal execution privileges.',
        ipAddress: '192.168.1.105',
      },
    ];
  }

  public getCurrentRole(): GranularRole {
    return this.currentRole;
  }

  public setRole(role: GranularRole) {
    this.currentRole = role;
    this.logAction(`Role changed to '${role}'`, 'permissions', `Current session granted permissions for ${role}`);
  }

  public getPermissionsForRole(role: GranularRole = this.currentRole): PermissionMatrix {
    const isOwner = role === 'owner';
    const isAdmin = role === 'admin' || isOwner;
    const isMaintainer = role === 'maintainer' || isAdmin;
    const isDeveloper = role === 'developer' || isMaintainer;
    const isReviewer = role === 'reviewer' || isDeveloper;
    const isCommenter = role === 'commenter' || isReviewer;

    return {
      workspace: {
        edit: isMaintainer,
        delete: isOwner,
        share: isAdmin,
      },
      projects: {
        create: isDeveloper,
        delete: isMaintainer,
        rename: isMaintainer,
      },
      files: {
        create: isDeveloper,
        edit: isDeveloper,
        delete: isDeveloper,
      },
      git: {
        commit: isDeveloper,
        push: isDeveloper,
        branch: isDeveloper,
        merge: isMaintainer,
      },
      terminal: {
        executeCommands: isDeveloper,
        sudoAccess: isAdmin,
      },
      ai: {
        generateCode: isCommenter,
        highCostModels: isDeveloper,
      },
      admin: {
        manageMembers: isAdmin,
        viewAuditLogs: isAdmin,
        billing: isOwner,
      },
    };
  }

  public logAction(action: string, category: AuditLogEntry['category'], details: string) {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      timestamp: Date.now(),
      actor: 'current.user@livepad.dev',
      action,
      category,
      details,
      ipAddress: '127.0.0.1',
    };
    this.auditLogs.unshift(entry);
  }

  public getAuditLogs(): AuditLogEntry[] {
    return this.auditLogs;
  }
}

export const granularPermissionService = GranularPermissionService.getInstance();
