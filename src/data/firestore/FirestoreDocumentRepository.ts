import { collection, doc, getDoc, getDocs, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, ensureAuth, isFirebaseConfigured, isFirestoreQuotaExhausted } from '../../lib/firebase';
import { DocumentRepository } from '../repositories/contracts';
import { DocumentRecord } from '../../domain/workspace/schema';
import { documentPath, documentsPath } from './paths';
import { cleanPatch, timestampToMillis } from './helpers';

export class FirestoreDocumentRepository implements DocumentRepository {
  async get(workspaceId: string, documentId: string): Promise<DocumentRecord | null> {
    if (!isFirebaseConfigured || !db || isFirestoreQuotaExhausted()) return null;
    await ensureAuth();
    const snapshot = await getDoc(doc(db, documentPath(workspaceId, documentId)));
    return snapshot.exists() ? this.map(workspaceId, snapshot.id, snapshot.data()) : null;
  }

  async list(workspaceId: string): Promise<DocumentRecord[]> {
    if (!isFirebaseConfigured || !db || isFirestoreQuotaExhausted()) return [];
    await ensureAuth();
    const snapshot = await getDocs(collection(db, documentsPath(workspaceId)));
    return snapshot.docs.map(d => this.map(workspaceId, d.id, d.data()));
  }

  async upsert(document: DocumentRecord): Promise<void> {
    if (!isFirebaseConfigured || !db) throw new Error('Firebase is not configured.');
    await ensureAuth();
    const ref = doc(db, documentPath(document.workspaceId, document.id));
    const existing = await getDoc(ref);
    if (existing.exists()) {
      await updateDoc(ref, { ...cleanPatch(document as unknown as Record<string, unknown>), updatedAt: serverTimestamp() });
    } else {
      await setDoc(ref, { ...document, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }
  }

  private map(workspaceId: string, id: string, data: Record<string, unknown>): DocumentRecord {
    return {
      id,
      workspaceId,
      title: (data.title || 'Untitled') as string,
      content: (data.content || '') as string,
      createdBy: (data.createdBy || '') as string,
      updatedBy: (data.updatedBy || '') as string,
      createdAt: timestampToMillis(data.createdAt),
      updatedAt: timestampToMillis(data.updatedAt),
      version: typeof data.version === 'number' ? data.version : 1,
    };
  }
}
