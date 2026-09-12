import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import fs from 'node:fs';
import path from 'node:path';

const emulatorAvailable = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const suite = emulatorAvailable ? describe : describe.skip;

let testEnv: RulesTestEnvironment;
const PROJECT_ID = 'livepad-rules-test';

const room = (overrides: Record<string, unknown> = {}) => ({
  roomCode: 'ROOM1',
  content: 'Hello',
  createdAt: Timestamp.fromMillis(1_700_000_000_000),
  updatedAt: Timestamp.fromMillis(1_700_000_000_000),
  privacy: 'private',
  ownerId: 'owner',
  creatorId: 'owner',
  createdBy: 'owner',
  creatorRole: 'owner',
  participants: {
    owner: { uid: 'owner', role: 'owner' },
    editor: { uid: 'editor', role: 'editor' },
    member: { uid: 'member', role: 'member' },
  },
  ...overrides,
});

beforeAll(async () => {
  if (!emulatorAvailable) return;
  const rules = fs.readFileSync(path.resolve('firestore.rules'), 'utf8');
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules },
  });
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'rooms/ROOM1'), room());
    await setDoc(doc(ctx.firestore(), 'rooms/PUBLIC1'), room({ roomCode: 'PUBLIC1', privacy: 'public', participants: { owner: { uid: 'owner', role: 'owner' } }, defaultRole: 'member' }));
    await setDoc(doc(ctx.firestore(), 'users/owner'), { name: 'Owner' });
    await setDoc(doc(ctx.firestore(), 'rooms/ROOM1/projects/p1'), { name: 'Project' });
  });
});

afterAll(async () => {
  if (testEnv) await testEnv.cleanup();
});

suite('Firestore security rules', () => {
  it('denies unauthenticated room reads and collection enumeration', async () => {
    const ctx = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(ctx.firestore(), 'rooms/ROOM1')));
    await assertFails(getDocs(collection(ctx.firestore(), 'rooms')));
  });

  it('allows authenticated public room get but denies private non-members', async () => {
    const ctx = testEnv.authenticatedContext('stranger');
    await assertSucceeds(getDoc(doc(ctx.firestore(), 'rooms/PUBLIC1')));
    await assertFails(getDoc(doc(ctx.firestore(), 'rooms/ROOM1')));
  });

  it('allows an editor to update content but blocks ownership changes', async () => {
    const ctx = testEnv.authenticatedContext('editor');
    await assertSucceeds(updateDoc(doc(ctx.firestore(), 'rooms/ROOM1'), { content: 'Updated', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(ctx.firestore(), 'rooms/ROOM1'), { ownerId: 'editor', updatedAt: serverTimestamp() }));
  });

  it('blocks member role escalation and cross-user presence changes', async () => {
    const ctx = testEnv.authenticatedContext('member');
    await assertFails(updateDoc(doc(ctx.firestore(), 'rooms/ROOM1'), {
      participants: { owner: { uid: 'owner', role: 'owner' }, editor: { uid: 'editor', role: 'admin' }, member: { uid: 'member', role: 'member' } },
    }));
    await assertFails(updateDoc(doc(ctx.firestore(), 'rooms/ROOM1'), {
      users: { owner: { online: false }, member: { online: true } },
    }));
  });

  it('allows a public self-join with the default role', async () => {
    const ctx = testEnv.authenticatedContext('new-user');
    await assertSucceeds(updateDoc(doc(ctx.firestore(), 'rooms/PUBLIC1'), {
      participants: { owner: { uid: 'owner', role: 'owner' }, 'new-user': { uid: 'new-user', role: 'member' } },
    }));
  });

  it('protects immutable history and validates actor identity', async () => {
    const ctx = testEnv.authenticatedContext('editor');
    await assertSucceeds(addDoc(collection(ctx.firestore(), 'rooms/ROOM1/history'), {
      content: 'snapshot', updatedAt: serverTimestamp(), authorName: 'Editor', authorUid: 'editor',
    }));
    await assertFails(addDoc(collection(ctx.firestore(), 'rooms/ROOM1/history'), {
      content: 'spoof', updatedAt: serverTimestamp(), authorName: 'Owner', authorUid: 'owner',
    }));
  });

  it('denies reading another user profile and allows self profile', async () => {
    const ctx = testEnv.authenticatedContext('member');
    await assertFails(getDoc(doc(ctx.firestore(), 'users/owner')));
    await assertSucceeds(getDoc(doc(ctx.firestore(), 'users/member')));
  });

  it('denies project access to non-members', async () => {
    const ctx = testEnv.authenticatedContext('stranger');
    await assertFails(getDoc(doc(ctx.firestore(), 'rooms/ROOM1/projects/p1')));
  });

  it('rejects oversized room content', async () => {
    const ctx = testEnv.authenticatedContext('editor');
    const oversized = 'x'.repeat(262_145);
    await assertFails(updateDoc(doc(ctx.firestore(), 'rooms/ROOM1'), { content: oversized, updatedAt: serverTimestamp() }));
  });
});
