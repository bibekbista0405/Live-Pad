import { 
  doc, 
  runTransaction, 
  collection, 
  addDoc, 
  serverTimestamp, 
  updateDoc, 
  deleteDoc,
  deleteField
} from 'firebase/firestore';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType, isFirestoreQuotaExhausted, markQuotaExhausted } from '../lib/firebase';
import { WorkspaceRole, WorkspaceAuditLog } from '../types';
import { WorkspacePermissionService } from './WorkspacePermissionService';

export class RoleService {
  /**
   * Log an administrative action to Firestore
   */
  static async addAuditLog(
    roomId: string,
    actorUid: string,
    actorName: string,
    action: string,
    target?: string,
    details?: string
  ): Promise<void> {
    if (!isFirebaseConfigured || !db || isFirestoreQuotaExhausted()) return;

    try {
      const logsRef = collection(db, 'rooms', roomId, 'audit_logs');
      await addDoc(logsRef, {
        who: `${actorName} (${actorUid.slice(0, 6)})`,
        actorUid,
        actorName,
        action,
        target: target || 'N/A',
        details: details || '',
        timestamp: Date.now(),
        createdAt: serverTimestamp(),
        device: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 80) : 'desktop'
      });
    } catch (err) {
      console.warn('[RoleService.addAuditLog] Failed to record audit log:', err);
    }
  }

  /**
   * Change user role in a workspace
   */
  static async changeUserRole(
    roomId: string,
    targetUid: string,
    targetName: string,
    newRole: WorkspaceRole,
    actorUid: string,
    actorName: string,
    actorRole: WorkspaceRole
  ): Promise<void> {
    if (newRole === 'owner') {
      throw new Error('Use transferOwnership to assign the Owner role.');
    }

    if (actorRole !== 'owner' && actorRole !== 'admin') {
      throw new Error('Unauthorized: Only Owners and Administrators can modify member roles.');
    }

    if (actorRole === 'admin' && newRole === 'admin') {
      throw new Error('Administrators cannot promote other members to Administrator.');
    }

    if (!isFirebaseConfigured || !db) {
      console.log(`[Local Mode] Role changed for ${targetUid} to ${newRole}`);
      return;
    }

    const roomRef = doc(db, 'rooms', roomId);

    try {
      await updateDoc(roomRef, {
        [`participants.${targetUid}.role`]: newRole,
        updatedAt: serverTimestamp()
      });

      await this.addAuditLog(
        roomId,
        actorUid,
        actorName,
        'CHANGED_ROLE',
        targetName,
        `Role updated to ${WorkspacePermissionService.getRoleDisplayName(newRole)}`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `rooms/${roomId}`);
    }
  }

  /**
   * Kick/Remove member from workspace
   */
  static async kickMember(
    roomId: string,
    targetUid: string,
    targetName: string,
    actorUid: string,
    actorName: string,
    actorRole: WorkspaceRole
  ): Promise<void> {
    if (!WorkspacePermissionService.canManageUsers(actorRole)) {
      throw new Error('Unauthorized: Missing permission to remove members.');
    }

    if (!isFirebaseConfigured || !db) return;

    const roomRef = doc(db, 'rooms', roomId);

    try {
      await updateDoc(roomRef, {
        [`participants.${targetUid}`]: deleteField(),
        [`users.${targetUid}`]: deleteField(),
        updatedAt: serverTimestamp()
      });

      await this.addAuditLog(
        roomId,
        actorUid,
        actorName,
        'REMOVED_MEMBER',
        targetName,
        `Member kicked from workspace`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `rooms/${roomId}`);
    }
  }

  /**
   * Mute or Unmute a member in chat/comments
   */
  static async toggleMuteMember(
    roomId: string,
    targetUid: string,
    targetName: string,
    isMuted: boolean,
    actorUid: string,
    actorName: string,
    actorRole: WorkspaceRole
  ): Promise<void> {
    if (!['owner', 'admin', 'moderator'].includes(actorRole)) {
      throw new Error('Unauthorized: Only Moderators and Admins can mute chat participants.');
    }

    if (!isFirebaseConfigured || !db) return;

    const roomRef = doc(db, 'rooms', roomId);

    try {
      await updateDoc(roomRef, {
        [`participants.${targetUid}.isMuted`]: isMuted,
        updatedAt: serverTimestamp()
      });

      await this.addAuditLog(
        roomId,
        actorUid,
        actorName,
        isMuted ? 'MUTED_MEMBER' : 'UNMUTED_MEMBER',
        targetName,
        isMuted ? 'Muted from chat and comments' : 'Chat privileges restored'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `rooms/${roomId}`);
    }
  }

  /**
   * Block or Unblock member access
   */
  static async toggleBlockMember(
    roomId: string,
    targetUid: string,
    targetName: string,
    isBlocked: boolean,
    actorUid: string,
    actorName: string,
    actorRole: WorkspaceRole
  ): Promise<void> {
    if (actorRole !== 'owner' && actorRole !== 'admin') {
      throw new Error('Unauthorized: Only Owners and Admins can block users.');
    }

    if (!isFirebaseConfigured || !db) return;

    const roomRef = doc(db, 'rooms', roomId);

    try {
      await updateDoc(roomRef, {
        [`participants.${targetUid}.isBlocked`]: isBlocked,
        updatedAt: serverTimestamp()
      });

      await this.addAuditLog(
        roomId,
        actorUid,
        actorName,
        isBlocked ? 'BLOCKED_MEMBER' : 'UNBLOCKED_MEMBER',
        targetName,
        isBlocked ? 'Access blocked' : 'Access unblocked'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `rooms/${roomId}`);
    }
  }

  /**
   * Atomic Workspace Ownership Transfer
   * Strictly enforces that only the current Owner can transfer ownership.
   */
  static async transferOwnership(
    roomId: string,
    newOwnerUid: string,
    newOwnerName: string,
    currentOwnerUid: string,
    currentOwnerName: string
  ): Promise<void> {
    if (!isFirebaseConfigured || !db) {
      console.log(`[Local Mode] Ownership transferred to ${newOwnerName}`);
      return;
    }

    const roomRef = doc(db, 'rooms', roomId);

    try {
      await runTransaction(db, async (transaction) => {
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists()) {
          throw new Error('Workspace document not found.');
        }

        const data = roomDoc.data();
        const existingOwnerId = data.ownerId || data.creatorId;

        if (existingOwnerId !== currentOwnerUid) {
          throw new Error('Security Violation: Only the registered Workspace Owner can transfer ownership.');
        }

        // Atomic Transaction updates
        transaction.update(roomRef, {
          ownerId: newOwnerUid,
          ownerName: newOwnerName,
          [`participants.${currentOwnerUid}.role`]: 'admin',
          [`participants.${newOwnerUid}.role`]: 'owner',
          updatedAt: serverTimestamp()
        });
      });

      await this.addAuditLog(
        roomId,
        currentOwnerUid,
        currentOwnerName,
        'TRANSFERRED_OWNERSHIP',
        newOwnerName,
        `Workspace ownership transferred from ${currentOwnerName} to ${newOwnerName}`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `rooms/${roomId}`);
    }
  }

  /**
   * Archive Workspace
   */
  static async archiveWorkspace(
    roomId: string,
    actorUid: string,
    actorName: string,
    actorRole: WorkspaceRole
  ): Promise<void> {
    if (actorRole !== 'owner') {
      throw new Error('Unauthorized: Only the Workspace Owner can archive this workspace.');
    }

    if (!isFirebaseConfigured || !db) return;

    const roomRef = doc(db, 'rooms', roomId);

    try {
      await updateDoc(roomRef, {
        status: 'archived',
        updatedAt: serverTimestamp()
      });

      await this.addAuditLog(
        roomId,
        actorUid,
        actorName,
        'ARCHIVED_WORKSPACE',
        roomId,
        'Workspace set to archived status'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `rooms/${roomId}`);
    }
  }

  /**
   * Delete Workspace permanently
   */
  static async deleteWorkspace(
    roomId: string,
    actorUid: string,
    actorName: string,
    actorRole: WorkspaceRole
  ): Promise<void> {
    if (actorRole !== 'owner') {
      throw new Error('Unauthorized: Only the Workspace Owner can delete this workspace.');
    }

    if (!isFirebaseConfigured || !db) return;

    const roomRef = doc(db, 'rooms', roomId);

    try {
      await this.addAuditLog(
        roomId,
        actorUid,
        actorName,
        'DELETED_WORKSPACE',
        roomId,
        'Workspace deleted permanently'
      );

      await deleteDoc(roomRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `rooms/${roomId}`);
    }
  }
}
