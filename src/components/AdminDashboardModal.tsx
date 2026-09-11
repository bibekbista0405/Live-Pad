import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  X, 
  Search, 
  Trash2, 
  Ban, 
  CheckCircle, 
  Users, 
  Layers, 
  AlertTriangle, 
  Crown,
  Settings,
  ShieldCheck,
  FolderGit2,
  Lock,
  Database,
  HardDrive,
  History,
  VolumeX,
  Volume2,
  ArrowRightLeft,
  UserX,
  UserCheck,
  Activity,
  FileText,
  Key,
  Globe,
  Radio,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NoteRoom, WorkspaceParticipant, WorkspaceRole, WorkspaceAuditLog } from '../types';
import { WorkspacePermissionService } from '../services/WorkspacePermissionService';
import { RoleService } from '../services/RoleService';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: NoteRoom | null;
  currentUserId: string;
  currentUserName: string;
  addToast?: (type: 'success' | 'error' | 'info', message: string) => void;
  onUpdateRoomPermissions?: (newPermissions: any) => void;
}

type AdminTab = 
  | 'general' 
  | 'members' 
  | 'roles' 
  | 'permissions' 
  | 'projects' 
  | 'security' 
  | 'workspace' 
  | 'storage' 
  | 'activity' 
  | 'danger';

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  room,
  currentUserId,
  currentUserName,
  addToast,
  onUpdateRoomPermissions
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('general');
  const [searchTerm, setSearchTerm] = useState('');
  const [auditLogs, setAuditLogs] = useState<WorkspaceAuditLog[]>([]);
  const [transferTargetUid, setTransferTargetUid] = useState<string>('');
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine current user's role in this room
  const currentUserParticipant = room?.participants?.[currentUserId];
  const isOwner = room?.ownerId === currentUserId || room?.creatorId === currentUserId || currentUserParticipant?.role === 'owner';
  const currentUserRole: WorkspaceRole = isOwner ? 'owner' : (currentUserParticipant?.role || 'member');
  const canAccessAdmin = WorkspacePermissionService.canAccessAdmin(currentUserRole);

  // Subscribe to real Firestore Audit Logs when modal is open and on 'activity' or 'general' tab
  useEffect(() => {
    if (!isOpen || !room?.id || !isFirebaseConfigured || !db) return;

    try {
      const logsRef = collection(db, 'rooms', room.id, 'audit_logs');
      const q = query(logsRef, orderBy('timestamp', 'desc'), limit(50));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const logs: WorkspaceAuditLog[] = [];
        snapshot.forEach((doc) => {
          logs.push({ id: doc.id, ...doc.data() } as WorkspaceAuditLog);
        });
        setAuditLogs(logs);
      }, (err) => {
        console.warn('[AdminDashboardModal] Audit logs snapshot error:', err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('[AdminDashboardModal] Failed to set up logs listener:', e);
    }
  }, [isOpen, room?.id]);

  if (!isOpen || !room) return null;

  // Access check guard
  if (!canAccessAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-6 max-w-md w-full text-center font-sans">
          <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Access Denied</h2>
          <p className="text-xs text-slate-400 mb-5 leading-relaxed">
            Only the <strong className="text-amber-400">Workspace Owner</strong> and designated <strong className="text-rose-400">Administrators</strong> can open the Admin Management Console.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const participantsList: WorkspaceParticipant[] = Object.values(room.participants || {});

  const filteredMembers = participantsList.filter((m) => {
    const queryStr = searchTerm.toLowerCase();
    return (
      m.name.toLowerCase().includes(queryStr) ||
      m.uid.toLowerCase().includes(queryStr) ||
      (m.role || '').toLowerCase().includes(queryStr)
    );
  });

  const handleRoleChange = async (targetUid: string, targetName: string, newRole: WorkspaceRole) => {
    try {
      setIsSubmitting(true);
      await RoleService.changeUserRole(
        room.id,
        targetUid,
        targetName,
        newRole,
        currentUserId,
        currentUserName,
        currentUserRole
      );
      addToast?.('success', `Updated ${targetName}'s role to ${WorkspacePermissionService.getRoleDisplayName(newRole)}`);
    } catch (err: any) {
      addToast?.('error', err.message || 'Failed to update role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKickMember = async (targetUid: string, targetName: string) => {
    if (!confirm(`Are you sure you want to remove ${targetName} from this workspace?`)) return;
    try {
      setIsSubmitting(true);
      await RoleService.kickMember(
        room.id,
        targetUid,
        targetName,
        currentUserId,
        currentUserName,
        currentUserRole
      );
      addToast?.('success', `Removed ${targetName} from workspace.`);
    } catch (err: any) {
      addToast?.('error', err.message || 'Failed to remove member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleMute = async (targetUid: string, targetName: string, currentMuted?: boolean) => {
    try {
      setIsSubmitting(true);
      await RoleService.toggleMuteMember(
        room.id,
        targetUid,
        targetName,
        !currentMuted,
        currentUserId,
        currentUserName,
        currentUserRole
      );
      addToast?.('info', `${targetName} ${!currentMuted ? 'muted' : 'unmuted'}.`);
    } catch (err: any) {
      addToast?.('error', err.message || 'Failed to toggle mute status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleBlock = async (targetUid: string, targetName: string, currentBlocked?: boolean) => {
    try {
      setIsSubmitting(true);
      await RoleService.toggleBlockMember(
        room.id,
        targetUid,
        targetName,
        !currentBlocked,
        currentUserId,
        currentUserName,
        currentUserRole
      );
      addToast?.('info', `${targetName} ${!currentBlocked ? 'blocked' : 'unblocked'}.`);
    } catch (err: any) {
      addToast?.('error', err.message || 'Failed to toggle block status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteTransfer = async () => {
    if (!transferTargetUid) return;
    const targetMember = room.participants?.[transferTargetUid];
    if (!targetMember) return;

    try {
      setIsSubmitting(true);
      await RoleService.transferOwnership(
        room.id,
        targetMember.uid,
        targetMember.name,
        currentUserId,
        currentUserName
      );
      addToast?.('success', `Workspace ownership successfully transferred to ${targetMember.name}!`);
      setShowTransferConfirm(false);
    } catch (err: any) {
      addToast?.('error', err.message || 'Failed to transfer ownership');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to ARCHIVE this workspace? Members will have read-only access.')) return;
    try {
      setIsSubmitting(true);
      await RoleService.archiveWorkspace(room.id, currentUserId, currentUserName, currentUserRole);
      addToast?.('info', 'Workspace archived successfully.');
    } catch (err: any) {
      addToast?.('error', err.message || 'Failed to archive workspace');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('PERMANENT DELETION WARNING:\n\nAre you sure you want to PERMANENTLY DELETE this workspace? This action cannot be undone.')) return;
    try {
      setIsSubmitting(true);
      await RoleService.deleteWorkspace(room.id, currentUserId, currentUserName, currentUserRole);
      addToast?.('success', 'Workspace permanently deleted.');
      onClose();
    } catch (err: any) {
      addToast?.('error', err.message || 'Failed to delete workspace');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabItems: { id: AdminTab; label: string; icon: any; ownerOnly?: boolean }[] = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'roles', label: 'Roles Matrix', icon: Shield },
    { id: 'permissions', label: 'Permissions', icon: Key },
    { id: 'projects', label: 'Projects', icon: FolderGit2 },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    { id: 'workspace', label: 'Workspace', icon: Database },
    { id: 'storage', label: 'Storage', icon: HardDrive },
    { id: 'activity', label: 'Audit Logs', icon: Activity },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, ownerOnly: true },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-6xl h-[85vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans text-slate-100"
      >
        {/* Top Console Bar */}
        <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  Workspace Admin Console
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  {room.workspaceName || 'LivePad Room'}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${WorkspacePermissionService.getRoleBadgeColor(currentUserRole)}`}>
                  {WorkspacePermissionService.getRoleDisplayName(currentUserRole)}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Owner ID: <span className="font-mono text-cyan-300">{room.ownerId || room.creatorId || 'N/A'}</span> • Role System v2
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Body Layout (Sidebar Tabs + Content Area) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Tabs Sidebar */}
          <div className="w-56 bg-slate-950/60 border-r border-slate-800 p-3 flex flex-col gap-1 overflow-y-auto shrink-0">
            {tabItems.map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              const isTabDisabled = tab.ownerOnly && !isOwner;

              return (
                <button
                  key={tab.id}
                  onClick={() => !isTabDisabled && setActiveTab(tab.id)}
                  disabled={isTabDisabled}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
                    isActive
                      ? 'bg-cyan-600 text-white shadow-md font-semibold'
                      : isTabDisabled
                      ? 'opacity-40 cursor-not-allowed text-slate-500'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconComp className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.ownerOnly && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                      Owner
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel Content */}
          <div className="flex-1 p-6 overflow-y-auto bg-slate-900/60 custom-scrollbar">
            {/* 1. GENERAL TAB */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-xl space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Settings className="w-4 h-4 text-cyan-400" /> Workspace Metadata
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-1">Workspace Title</span>
                      <span className="font-semibold text-white text-sm">{room.workspaceName || 'Untitled Workspace'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Room Code</span>
                      <span className="font-mono text-cyan-400 font-bold text-sm bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                        {room.roomCode || room.id}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Owner Name / ID</span>
                      <span className="text-slate-200 font-mono">
                        {room.ownerName || room.creatorId || 'Bibek'} ({room.ownerId || 'uid123'})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Role Versioning Engine</span>
                      <span className="text-emerald-400 font-mono font-semibold">RBAC v2 (Enforced Server-Side)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Lifecycle Status</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        room.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}>
                        {room.status || 'ACTIVE'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Privacy Tier</span>
                      <span className="text-slate-200 capitalize font-medium">{room.privacy || 'public'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <h4 className="font-bold text-amber-300 mb-1">Ownership Security Protocol</h4>
                    <p className="text-slate-300 leading-relaxed">
                      This workspace is permanently linked to owner <strong className="text-white">{room.ownerName || room.ownerId}</strong>. Even if participants manually trigger admin calls, Firestore security rules strictly validate role levels server-side.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. MEMBERS TAB */}
            {activeTab === 'members' && (
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="flex items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search member name, UID, or role..."
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    Total: {participantsList.length} members
                  </span>
                </div>

                {/* Members Table */}
                <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-900/80">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/90 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-700">
                      <tr>
                        <th className="py-3 px-3">Participant</th>
                        <th className="py-3 px-3">Current Role</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Device</th>
                        <th className="py-3 px-3 text-right">Administrative Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredMembers.map((member) => {
                        const isMemberOwner = member.uid === room.ownerId || member.role === 'owner';
                        const isSelf = member.uid === currentUserId;

                        return (
                          <tr key={member.uid} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-md shrink-0"
                                  style={{ backgroundColor: member.color || '#3b82f6' }}
                                >
                                  {member.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                                    {member.name}
                                    {isSelf && (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                                        YOU
                                      </span>
                                    )}
                                    {isMemberOwner && (
                                      <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    )}
                                  </span>
                                  <span className="font-mono text-[10px] text-slate-500 block">
                                    UID: {member.uid.slice(0, 10)}...
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              {/* Role Selector */}
                              {isMemberOwner ? (
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${WorkspacePermissionService.getRoleBadgeColor('owner')}`}>
                                  {WorkspacePermissionService.getRoleDisplayName('owner')}
                                </span>
                              ) : isOwner ? (
                                <select
                                  value={member.role || 'member'}
                                  onChange={(e) => handleRoleChange(member.uid, member.name, e.target.value as WorkspaceRole)}
                                  disabled={isSubmitting}
                                  className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                                >
                                  <option value="admin">Administrator</option>
                                  <option value="moderator">Moderator</option>
                                  <option value="editor">Editor</option>
                                  <option value="commenter">Commenter</option>
                                  <option value="viewer">Viewer</option>
                                  <option value="guest">Guest</option>
                                </select>
                              ) : (
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${WorkspacePermissionService.getRoleBadgeColor(member.role || 'viewer')}`}>
                                  {WorkspacePermissionService.getRoleDisplayName(member.role || 'viewer')}
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3">
                              <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                                <span className={`w-2 h-2 rounded-full ${member.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                                {member.isOnline ? 'Online' : 'Offline'}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                              {member.device || 'Desktop Browser'}
                            </td>

                            <td className="py-3 px-3 text-right">
                              {!isMemberOwner && !isSelf && (
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Mute Toggle */}
                                  <button
                                    onClick={() => handleToggleMute(member.uid, member.name, member.isMuted)}
                                    title={member.isMuted ? 'Unmute' : 'Mute chat'}
                                    className={`p-1.5 rounded-lg border transition-colors ${
                                      member.isMuted 
                                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                                        : 'bg-slate-800 text-slate-400 hover:text-slate-100 border-slate-700'
                                    }`}
                                  >
                                    {member.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                                  </button>

                                  {/* Kick / Remove */}
                                  <button
                                    onClick={() => handleKickMember(member.uid, member.name)}
                                    title="Kick member"
                                    className="p-1.5 bg-slate-800 text-rose-400 hover:bg-rose-500/20 rounded-lg border border-slate-700 hover:border-rose-500/40 transition-colors"
                                  >
                                    <UserX className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. ROLES MATRIX TAB */}
            {activeTab === 'roles' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" /> Supported Role Hierarchy & Capabilities
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      role: 'owner' as WorkspaceRole,
                      title: 'Owner 👑',
                      desc: 'Full, non-transferable authority over workspace settings, roles, ownership, archiving, and deletion.',
                      caps: ['Admin Panel', 'Manage Roles', 'Archive Workspace', 'Delete Workspace', 'Transfer Ownership', 'Manage Members']
                    },
                    {
                      role: 'admin' as WorkspaceRole,
                      title: 'Admin 🛡️',
                      desc: 'Manages members, folders, projects, and chat moderation. Cannot delete or transfer workspace.',
                      caps: ['Manage Members', 'Create Projects', 'Manage Folders', 'Moderate Chat', 'Edit Documents']
                    },
                    {
                      role: 'moderator' as WorkspaceRole,
                      title: 'Moderator ⚖️',
                      desc: 'Moderates communication channels, mutes chat participants, and cleans up messages.',
                      caps: ['Mute Chat', 'Delete Comments', 'Remove Messages', 'Edit Documents']
                    },
                    {
                      role: 'editor' as WorkspaceRole,
                      title: 'Editor ✍️',
                      desc: 'Full editing access to code playgrounds, documents, markdown files, and uploads.',
                      caps: ['Edit Documents', 'Edit Code', 'Upload Files', 'Create Projects']
                    },
                    {
                      role: 'commenter' as WorkspaceRole,
                      title: 'Commenter 💬',
                      desc: 'Can participate in chat discussions and leave comments without editing document content.',
                      caps: ['Chat', 'Leave Comments', 'Read Documents']
                    },
                    {
                      role: 'viewer' as WorkspaceRole,
                      title: 'Viewer 👁️',
                      desc: 'Read-only access to all workspace documents and code files.',
                      caps: ['Read Documents', 'Export Files']
                    },
                    {
                      role: 'guest' as WorkspaceRole,
                      title: 'Guest 👤',
                      desc: 'Temporary session access restricted to basic viewing.',
                      caps: ['Temporary Read']
                    },
                  ].map((item) => (
                    <div key={item.role} className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${WorkspacePermissionService.getRoleBadgeColor(item.role)}`}>
                          {item.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
                      <div className="flex flex-wrap gap-1">
                        {item.caps.map((c) => (
                          <span key={c} className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700 font-mono">
                            ✓ {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. PERMISSIONS TAB */}
            {activeTab === 'permissions' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-cyan-400" /> Global Permission Toggles
                </h3>

                <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-xl space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-slate-700/60">
                    <div>
                      <h4 className="text-xs font-bold text-white">Allow Guest Editing</h4>
                      <p className="text-[11px] text-slate-400">Permit unregistered guest users to edit content directly.</p>
                    </div>
                    <input 
                      type="checkbox"
                      checked={!!room.permissions?.allowGuestEdit}
                      disabled={!isOwner}
                      className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-900 border-slate-700"
                    />
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-slate-700/60">
                    <div>
                      <h4 className="text-xs font-bold text-white">Enable Collaborative Chat</h4>
                      <p className="text-[11px] text-slate-400">Enable real-time chat side-panel in workspace.</p>
                    </div>
                    <input 
                      type="checkbox"
                      checked={room.permissions?.allowChat !== false}
                      disabled={!isOwner}
                      className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-900 border-slate-700"
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="text-xs font-bold text-white">Document Exporting</h4>
                      <p className="text-[11px] text-slate-400">Allow participants to export workspace as PDF, Markdown, or HTML.</p>
                    </div>
                    <input 
                      type="checkbox"
                      checked={room.permissions?.allowExport !== false}
                      disabled={!isOwner}
                      className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-900 border-slate-700"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 5. PROJECTS TAB */}
            {activeTab === 'projects' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-cyan-400" /> Integrated Projects & Repositories
                </h3>
                <div className="p-6 bg-slate-800/40 border border-slate-700/80 rounded-xl text-center">
                  <FolderGit2 className="w-8 h-8 text-cyan-400 mx-auto mb-2 opacity-80" />
                  <p className="text-xs font-semibold text-white mb-1">Live Coding IDE Active</p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Projects created inside this workspace automatically inherit the active workspace permission boundaries.
                  </p>
                </div>
              </div>
            )}

            {/* 6. SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Firestore Zero-Trust Security Status
                </h3>
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold">
                    <CheckCircle className="w-4 h-4" /> Firestore Rules Server Enforcement Active
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    All document mutations, role escalations, and ownership transfers are checked by strict rules_version = '2' expressions. Unauthorized client updates are rejected server-side.
                  </p>
                </div>
              </div>
            )}

            {/* 7. WORKSPACE TAB */}
            {activeTab === 'workspace' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" /> Workspace Analytics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-800/60 border border-slate-700/80 rounded-xl">
                    <span className="text-slate-400 block mb-1">Document Length</span>
                    <span className="text-base font-extrabold text-white">{room.content?.length || 0} chars</span>
                  </div>
                  <div className="p-3 bg-slate-800/60 border border-slate-700/80 rounded-xl">
                    <span className="text-slate-400 block mb-1">Participants</span>
                    <span className="text-base font-extrabold text-cyan-400">{participantsList.length} total</span>
                  </div>
                  <div className="p-3 bg-slate-800/60 border border-slate-700/80 rounded-xl">
                    <span className="text-slate-400 block mb-1">Attachments</span>
                    <span className="text-base font-extrabold text-purple-400">{room.attachments?.length || 0} items</span>
                  </div>
                </div>
              </div>
            )}

            {/* 8. STORAGE TAB */}
            {activeTab === 'storage' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-cyan-400" /> Storage & Media Attachments
                </h3>
                <p className="text-xs text-slate-400">
                  {room.attachments?.length ? `${room.attachments.length} attachments stored in workspace.` : 'No attachments uploaded yet.'}
                </p>
              </div>
            )}

            {/* 9. ACTIVITY LOGS TAB */}
            {activeTab === 'activity' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" /> Real-time Audit Trail
                </h3>

                {auditLogs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 italic bg-slate-800/30 rounded-xl border border-slate-800">
                    No administrative action logs recorded yet.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-slate-800/60 border border-slate-700/80 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/30">
                            {log.action}
                          </span>
                          <div>
                            <span className="font-semibold text-white">{log.who || log.actorName}</span>
                            <span className="text-slate-400 mx-1">→</span>
                            <span className="text-cyan-300">{log.target}</span>
                            <p className="text-[11px] text-slate-400">{log.details}</p>
                          </div>
                        </div>
                        <span className="font-mono text-[10px] text-slate-500 shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 10. DANGER ZONE TAB (Owner Only) */}
            {activeTab === 'danger' && isOwner && (
              <div className="space-y-6">
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-4">
                  <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" /> Danger Zone Actions
                  </h3>

                  {/* Transfer Ownership Block */}
                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" /> Transfer Workspace Ownership
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Transfer the primary Owner role to another participant. You will become an Administrator.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={transferTargetUid}
                        onChange={(e) => setTransferTargetUid(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:border-amber-500"
                      >
                        <option value="">Select new owner member...</option>
                        {participantsList
                          .filter((p) => p.uid !== currentUserId)
                          .map((p) => (
                            <option key={p.uid} value={p.uid}>
                              {p.name} ({p.role || 'member'})
                            </option>
                          ))}
                      </select>

                      <button
                        onClick={() => setShowTransferConfirm(true)}
                        disabled={!transferTargetUid || isSubmitting}
                        className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors"
                      >
                        Transfer Ownership
                      </button>
                    </div>
                  </div>

                  {/* Archive Workspace Block */}
                  <div className="flex items-center justify-between p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                    <div>
                      <h4 className="text-xs font-bold text-white">Archive Workspace</h4>
                      <p className="text-[11px] text-slate-400">Set workspace to read-only mode for all members.</p>
                    </div>
                    <button
                      onClick={handleArchive}
                      disabled={isSubmitting}
                      className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Archive Workspace
                    </button>
                  </div>

                  {/* Delete Workspace Block */}
                  <div className="flex items-center justify-between p-3 bg-rose-950/40 border border-rose-900/60 rounded-xl">
                    <div>
                      <h4 className="text-xs font-bold text-rose-300">Delete Workspace Permanently</h4>
                      <p className="text-[11px] text-rose-400/80">
                        Irreversibly delete this workspace and all attached files/history.
                      </p>
                    </div>
                    <button
                      onClick={handleDelete}
                      disabled={isSubmitting}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      Delete Workspace
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transfer Ownership Confirmation Overlay */}
        <AnimatePresence>
          {showTransferConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-slate-900 border border-amber-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
              >
                <div className="flex items-center gap-3 text-amber-400">
                  <Crown className="w-6 h-6" />
                  <h3 className="text-base font-bold text-white">Confirm Ownership Transfer</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Are you sure you want to transfer ownership to{' '}
                  <strong className="text-amber-300">
                    {room.participants?.[transferTargetUid]?.name}
                  </strong>
                  ? You will step down to an Administrator role.
                </p>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowTransferConfirm(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteTransfer}
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-900/40"
                  >
                    Confirm Transfer
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 text-xs text-slate-400 flex justify-between items-center shrink-0">
          <span className="font-mono text-[11px]">
            LivePad RBAC Console • Session ID: <span className="text-cyan-400">{room.id}</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors"
          >
            Close Console
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboardModal;
