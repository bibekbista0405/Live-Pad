import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db, ensureAuth, isFirebaseConfigured, isFirestoreQuotaExhausted } from '../../lib/firebase';
import { MemberRepository } from '../repositories/contracts';
import { WorkspaceMemberRecord } from '../../domain/workspace/schema';
import { memberPath, membersPath } from './paths';
import { timestampToMillis } from './helpers';

export class FirestoreMemberRepository implements MemberRepository {
  async get(workspaceId: string, uid: string): Promise<WorkspaceMemberRecord | null> {
    if (!isFirebaseConfigured || !db || isFirestoreQuotaExhausted()) return null;
    await ensureAuth();
    const snapshot = await getDoc(doc(db, memberPath(workspaceId, uid)));
    if (!snapshot.exists()) return null;
    return this.map(snapshot.id, snapshot.data());
  }

  async list(workspaceId: string): Promise<WorkspaceMemberRecord[]> {
    if (!isFirebaseConfigured || !db || isFirestoreQuotaExhausted()) return [];
    await ensureAuth();
    const snapshot = await getDocs(collection(db, membersPath(workspaceId)));
    return snapshot.docs.map(d => this.map(d.id, d.data()));
  }

  async upsert(workspaceId: string, member: WorkspaceMemberRecord): Promise<void> {
    if (!isFirebaseConfigured || !db) throw new Error('Firebase is not configured.');
    await ensureAuth();
    await setDoc(doc(db, memberPath(workspaceId, member.uid)), member, { merge: true });
  }

  async remove(workspaceId: string, uid: string): Promise<void> {
    if (!isFirebaseConfigured || !db) throw new Error('Firebase is not configured.');
    await ensureAuth();
    await deleteDoc(doc(db, memberPath(workspaceId, uid)));
  }

  private map(uid: string, data: Record<string, unknown>): WorkspaceMemberRecord {
    return {
      uid,
      role: (data.role || 'viewer') as WorkspaceMemberRecord['role'],
      joinedAt: timestampToMillis(data.joinedAt),
      displayName: data.displayName as string | undefined,
      email: data.email as string | undefined,
      isBlocked: data.isBlocked as boolean | undefined,
      isMuted: data.isMuted as boolean | undefined,
    };
  }
}
