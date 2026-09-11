import { FirestoreDocumentRepository } from '../firestore/FirestoreDocumentRepository';
import { FirestoreMemberRepository } from '../firestore/FirestoreMemberRepository';
import { FirestoreWorkspaceRepository } from '../firestore/FirestoreWorkspaceRepository';

export const repositories = {
  workspace: new FirestoreWorkspaceRepository(),
  member: new FirestoreMemberRepository(),
  document: new FirestoreDocumentRepository(),
};

export * from './contracts';
