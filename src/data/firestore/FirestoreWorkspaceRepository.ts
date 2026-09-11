import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, ensureAuth, isFirebaseConfigured, isFirestoreQuotaExhausted } from '../../lib/firebase';
import { WorkspaceRepository } from '../repositories/contracts';
import { WorkspaceRecord } from '../../domain/workspace/schema';
import { workspacePath } from './paths';
import { cleanPatch, timestampToMillis } from './helpers';

export class FirestoreWorkspaceRepository implements WorkspaceRepository {
  async get(id: string): Promise<WorkspaceRecord | null> {
    if (!isFirebaseConfigured || !db || isFirestoreQuotaExhausted()) return null;
    await ensureAuth();
    const snapshot = await getDoc(doc(db, workspacePath(id)));
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    return {
      id: snapshot.id,
      name: data.name || 'Untitled Workspace',
      ownerId: data.ownerId,
      privacy: data.privacy || 'private',
      lifecycle: data.lifecycle || 'active',
      createdAt: timestampToMillis(data.createdAt),
      updatedAt: timestampToMillis(data.updatedAt),
      participantLimit: data.participantLimit,
      description: data.description,
      category: data.category,
      type: data.type,
    };
  }

  async create(workspace: WorkspaceRecord): Promise<void> {
    if (!isFirebaseConfigured || !db) throw new Error('Firebase is not configured.');
    await ensureAuth();
    await setDoc(doc(db, workspacePath(workspace.id)), {
      ...workspace,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async update(id: string, patch: Partial<WorkspaceRecord>): Promise<void> {
    if (!isFirebaseConfigured || !db) throw new Error('Firebase is not configured.');
    await ensureAuth();
    await updateDoc(doc(db, workspacePath(id)), {
      ...cleanPatch(patch),
      updatedAt: serverTimestamp(),
    });
  }
}
