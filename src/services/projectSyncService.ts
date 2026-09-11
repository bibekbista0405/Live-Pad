/**
 * Firestore Realtime Synchronization Service for LivePad Code Projects
 * Syncs projects, folders, files, file versions, and trash with error handling.
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, isFirebaseConfigured, ensureAuth, isFirestoreQuotaExhausted } from '../lib/firebase';
import { CodingProject, ProjectFolder, ProjectFile, FileVersion, TrashedItem } from '../types/code';

export function subscribeToWorkspaceProjects(
  workspaceId: string,
  onUpdate: (projects: CodingProject[]) => void,
  onError?: (err: any) => void
) {
  if (!isFirebaseConfigured || !db || !workspaceId || isFirestoreQuotaExhausted()) {
    return () => {};
  }

  let unsub: (() => void) | null = null;
  let active = true;

  ensureAuth().then(() => {
    if (!active) return;
    const projectsRef = collection(db, 'rooms', workspaceId, 'projects');
    unsub = onSnapshot(
      projectsRef,
      (snapshot) => {
        const projects: CodingProject[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          projects.push({
            id: docSnap.id,
            workspaceId: data.workspaceId || workspaceId,
            name: data.name || 'Untitled Project',
            description: data.description || '',
            createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt || Date.now()),
            updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.updatedAt || Date.now()),
            createdBy: data.createdBy || 'collaborator',
            activeFileId: data.activeFileId || null,
            openFileIds: data.openFileIds || [],
            pinnedFileIds: data.pinnedFileIds || [],
            settings: data.settings || {}
          });
        });
        onUpdate(projects);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, `rooms/${workspaceId}/projects`);
        } catch (e) {
          console.warn('[projectSyncService] Workspace projects listener error:', e);
        }
        if (onError) onError(error);
      }
    );
  });

  return () => {
    active = false;
    if (unsub) unsub();
  };
}

export function subscribeToProjectStructure(
  workspaceId: string,
  projectId: string,
  onFoldersUpdate: (folders: ProjectFolder[]) => void,
  onFilesUpdate: (files: ProjectFile[]) => void,
  onTrashUpdate?: (trash: TrashedItem[]) => void
) {
  if (!isFirebaseConfigured || !db || !workspaceId || !projectId || isFirestoreQuotaExhausted()) {
    return () => {};
  }

  let active = true;
  let unsubFolders: (() => void) | null = null;
  let unsubFiles: (() => void) | null = null;
  let unsubTrash: (() => void) | null = null;

  ensureAuth().then(() => {
    if (!active) return;

    const foldersRef = collection(db, 'rooms', workspaceId, 'projects', projectId, 'folders');
    const filesRef = collection(db, 'rooms', workspaceId, 'projects', projectId, 'files');
    const trashRef = collection(db, 'rooms', workspaceId, 'projects', projectId, 'trash');

    unsubFolders = onSnapshot(
      foldersRef,
      (snapshot) => {
        const folders: ProjectFolder[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          folders.push({
            id: d.id,
            projectId,
            name: data.name,
            parentId: data.parentId ?? null,
            path: data.path || data.name,
            createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt || Date.now()),
            updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.updatedAt || Date.now()),
            isExpanded: data.isExpanded ?? false
          });
        });
        onFoldersUpdate(folders);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.GET, `rooms/${workspaceId}/projects/${projectId}/folders`);
        } catch (e) {
          console.warn('[projectSyncService] Folders sync error:', e);
        }
      }
    );

    unsubFiles = onSnapshot(
      filesRef,
      (snapshot) => {
        const files: ProjectFile[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          files.push({
            id: d.id,
            projectId,
            name: data.name,
            extension: data.extension || data.name.split('.').pop() || '',
            language: data.language || 'javascript',
            path: data.path || data.name,
            parentId: data.parentId ?? null,
            content: data.content ?? '',
            createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt || Date.now()),
            updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.updatedAt || Date.now()),
            createdBy: data.createdBy || 'collaborator',
            updatedBy: data.updatedBy || 'collaborator',
            version: data.version || 1,
            isPinned: data.isPinned ?? false,
            isUnsaved: false
          });
        });
        onFilesUpdate(files);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.GET, `rooms/${workspaceId}/projects/${projectId}/files`);
        } catch (e) {
          console.warn('[projectSyncService] Files sync error:', e);
        }
      }
    );

    unsubTrash = onSnapshot(
      trashRef,
      (snapshot) => {
        if (!onTrashUpdate) return;
        const trash: TrashedItem[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          trash.push({
            id: d.id,
            projectId,
            originalItem: data.originalItem,
            itemType: data.itemType || 'file',
            deletedAt: data.deletedAt?.toMillis ? data.deletedAt.toMillis() : (data.deletedAt || Date.now()),
            deletedBy: data.deletedBy || 'collaborator',
            subFiles: data.subFiles || [],
            subFolders: data.subFolders || []
          });
        });
        onTrashUpdate(trash);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.GET, `rooms/${workspaceId}/projects/${projectId}/trash`);
        } catch (e) {
          console.warn('[projectSyncService] Trash sync error:', e);
        }
      }
    );
  });

  return () => {
    active = false;
    if (unsubFolders) unsubFolders();
    if (unsubFiles) unsubFiles();
    if (unsubTrash) unsubTrash();
  };
}

export async function initializeWorkspaceProjectsInFirestore(
  workspaceId: string,
  userName: string = 'LivePad Developer'
): Promise<{ project: CodingProject; folders: ProjectFolder[]; files: ProjectFile[] }> {
  const projectId = `proj-${workspaceId}-main`;
  const defaultProj: CodingProject = {
    id: projectId,
    workspaceId,
    name: 'Main Project',
    description: 'Primary workspace coding project',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: userName,
    activeFileId: `file-index-${workspaceId}`,
    openFileIds: [`file-index-${workspaceId}`, `file-app-${workspaceId}`, `file-style-${workspaceId}`],
    pinnedFileIds: [`file-index-${workspaceId}`]
  };

  const defaultFolders: ProjectFolder[] = [
    {
      id: `folder-src-${workspaceId}`,
      projectId,
      name: 'src',
      parentId: null,
      path: 'src',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isExpanded: true
    },
    {
      id: `folder-components-${workspaceId}`,
      projectId,
      name: 'components',
      parentId: `folder-src-${workspaceId}`,
      path: 'src/components',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isExpanded: true
    }
  ];

  const defaultFiles: ProjectFile[] = [
    {
      id: `file-index-${workspaceId}`,
      projectId,
      name: 'index.html',
      extension: 'html',
      language: 'html',
      path: 'index.html',
      parentId: null,
      content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>LivePad Application</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <div id="app"></div>\n  <script src="src/app.js"></script>\n</body>\n</html>`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: userName,
      updatedBy: userName,
      version: 1,
      isPinned: true
    },
    {
      id: `file-app-${workspaceId}`,
      projectId,
      name: 'app.js',
      extension: 'js',
      language: 'javascript',
      path: 'src/app.js',
      parentId: `folder-src-${workspaceId}`,
      content: `// LivePad Workspace Application\nconsole.log("LivePad IDE Initialized for workspace: ${workspaceId}");\n\nconst app = document.getElementById("app");\nif (app) {\n  app.innerHTML = "<h1 style='font-family: sans-serif; color: #0ea5e9;'>Hello from LivePad!</h1>";\n}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: userName,
      updatedBy: userName,
      version: 1,
      isPinned: false
    },
    {
      id: `file-style-${workspaceId}`,
      projectId,
      name: 'style.css',
      extension: 'css',
      language: 'css',
      path: 'style.css',
      parentId: null,
      content: `/* LivePad Stylesheet */\nbody {\n  margin: 0;\n  padding: 2rem;\n  background: #0f172a;\n  color: #f8fafc;\n  font-family: system-ui, sans-serif;\n}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: userName,
      updatedBy: userName,
      version: 1,
      isPinned: false
    }
  ];

  if (isFirebaseConfigured && db && workspaceId && !isFirestoreQuotaExhausted()) {
    await ensureAuth();
    await saveProjectDoc(workspaceId, defaultProj);
    for (const folder of defaultFolders) {
      await saveProjectFolderDoc(workspaceId, projectId, folder);
    }
    for (const file of defaultFiles) {
      await saveProjectFileDoc(workspaceId, projectId, file);
    }
  }

  return { project: defaultProj, folders: defaultFolders, files: defaultFiles };
}

export async function saveProjectDoc(workspaceId: string, project: CodingProject): Promise<void> {
  if (!isFirebaseConfigured || !db || !workspaceId || isFirestoreQuotaExhausted()) return;
  await ensureAuth();
  const path = `rooms/${workspaceId}/projects/${project.id}`;
  try {
    await setDoc(
      doc(db, 'rooms', workspaceId, 'projects', project.id),
      {
        workspaceId,
        name: project.name,
        description: project.description || '',
        createdAt: project.createdAt ? new Date(project.createdAt) : serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: project.createdBy,
        activeFileId: project.activeFileId || null,
        openFileIds: project.openFileIds || [],
        pinnedFileIds: project.pinnedFileIds || [],
        settings: project.settings || {}
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveProjectFileDoc(workspaceId: string, projectId: string, file: ProjectFile): Promise<void> {
  if (!isFirebaseConfigured || !db || !workspaceId || !projectId || isFirestoreQuotaExhausted()) return;
  await ensureAuth();
  const path = `rooms/${workspaceId}/projects/${projectId}/files/${file.id}`;
  try {
    await setDoc(
      doc(db, 'rooms', workspaceId, 'projects', projectId, 'files', file.id),
      {
        name: file.name,
        extension: file.extension,
        language: file.language,
        path: file.path,
        parentId: file.parentId ?? null,
        content: file.content,
        createdAt: file.createdAt ? new Date(file.createdAt) : serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: file.createdBy,
        updatedBy: file.updatedBy,
        version: file.version || 1,
        isPinned: !!file.isPinned
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteProjectFileDoc(workspaceId: string, projectId: string, fileId: string): Promise<void> {
  if (!isFirebaseConfigured || !db || !workspaceId || !projectId || isFirestoreQuotaExhausted()) return;
  await ensureAuth();
  const path = `rooms/${workspaceId}/projects/${projectId}/files/${fileId}`;
  try {
    await deleteDoc(doc(db, 'rooms', workspaceId, 'projects', projectId, 'files', fileId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveProjectFolderDoc(workspaceId: string, projectId: string, folder: ProjectFolder): Promise<void> {
  if (!isFirebaseConfigured || !db || !workspaceId || !projectId || isFirestoreQuotaExhausted()) return;
  await ensureAuth();
  const path = `rooms/${workspaceId}/projects/${projectId}/folders/${folder.id}`;
  try {
    await setDoc(
      doc(db, 'rooms', workspaceId, 'projects', projectId, 'folders', folder.id),
      {
        name: folder.name,
        parentId: folder.parentId ?? null,
        path: folder.path,
        createdAt: folder.createdAt ? new Date(folder.createdAt) : serverTimestamp(),
        updatedAt: serverTimestamp(),
        isExpanded: !!folder.isExpanded
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteProjectFolderDoc(workspaceId: string, projectId: string, folderId: string): Promise<void> {
  if (!isFirebaseConfigured || !db || !workspaceId || !projectId || isFirestoreQuotaExhausted()) return;
  await ensureAuth();
  const path = `rooms/${workspaceId}/projects/${projectId}/folders/${folderId}`;
  try {
    await deleteDoc(doc(db, 'rooms', workspaceId, 'projects', projectId, 'folders', folderId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveFileVersionDoc(
  workspaceId: string,
  projectId: string,
  fileId: string,
  version: FileVersion
): Promise<void> {
  if (!isFirebaseConfigured || !db || !workspaceId || !projectId || isFirestoreQuotaExhausted()) return;
  const path = `rooms/${workspaceId}/projects/${projectId}/files/${fileId}/versions/${version.id}`;
  try {
    await setDoc(
      doc(db, 'rooms', workspaceId, 'projects', projectId, 'files', fileId, 'versions', version.id),
      {
        fileId,
        versionNumber: version.versionNumber,
        content: version.content,
        updatedAt: serverTimestamp(),
        authorName: version.authorName,
        summary: version.summary || ''
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fetchFileVersionsDocs(
  workspaceId: string,
  projectId: string,
  fileId: string
): Promise<FileVersion[]> {
  if (!isFirebaseConfigured || !db || !workspaceId || !projectId || isFirestoreQuotaExhausted()) return [];
  const path = `rooms/${workspaceId}/projects/${projectId}/files/${fileId}/versions`;
  try {
    const q = query(collection(db, 'rooms', workspaceId, 'projects', projectId, 'files', fileId, 'versions'), orderBy('versionNumber', 'desc'));
    const snapshot = await getDocs(q);
    const versions: FileVersion[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      versions.push({
        id: d.id,
        fileId,
        versionNumber: data.versionNumber,
        content: data.content,
        updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.updatedAt || Date.now()),
        authorName: data.authorName,
        summary: data.summary || ''
      });
    });
    return versions;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return [];
  }
}

export async function saveTrashDoc(workspaceId: string, projectId: string, trashItem: TrashedItem): Promise<void> {
  if (!isFirebaseConfigured || !db || !workspaceId || !projectId || isFirestoreQuotaExhausted()) return;
  const path = `rooms/${workspaceId}/projects/${projectId}/trash/${trashItem.id}`;
  try {
    await setDoc(doc(db, 'rooms', workspaceId, 'projects', projectId, 'trash', trashItem.id), {
      originalItem: trashItem.originalItem,
      itemType: trashItem.itemType,
      deletedAt: serverTimestamp(),
      deletedBy: trashItem.deletedBy,
      subFiles: trashItem.subFiles || [],
      subFolders: trashItem.subFolders || []
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteTrashDoc(workspaceId: string, projectId: string, trashId: string): Promise<void> {
  if (!isFirebaseConfigured || !db || !workspaceId || !projectId || isFirestoreQuotaExhausted()) return;
  const path = `rooms/${workspaceId}/projects/${projectId}/trash/${trashId}`;
  try {
    await deleteDoc(doc(db, 'rooms', workspaceId, 'projects', projectId, 'trash', trashId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
