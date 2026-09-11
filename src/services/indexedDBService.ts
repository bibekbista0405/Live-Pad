/**
 * IndexedDB Local Persistence Engine for LivePad Code Projects
 * Provides fast, offline-first storage for projects, files, folders, versions, and trash.
 */

import { CodingProject, ProjectFolder, ProjectFile, FileVersion, TrashedItem } from '../types/code';
import { notifyStorageError } from '../utils/offlineDB';

const DB_NAME = 'LivePadCodeEngineDB';
const DB_VERSION = 1;

interface LocalCacheSchema {
  projects: CodingProject[];
  folders: Record<string, ProjectFolder[]>; // projectId -> folders
  files: Record<string, ProjectFile[]>;     // projectId -> files
  versions: Record<string, FileVersion[]>;  // fileId -> versions
  trash: Record<string, TrashedItem[]>;     // projectId -> trashed items
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('folders')) {
        db.createObjectStore('folders', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('versions')) {
        db.createObjectStore('versions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('trash')) {
        db.createObjectStore('trash', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveLocalProjectData(
  project: CodingProject,
  folders: ProjectFolder[],
  files: ProjectFile[],
  trash: TrashedItem[] = []
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(['projects', 'folders', 'files', 'trash'], 'readwrite');

    tx.objectStore('projects').put(project);

    const folderStore = tx.objectStore('folders');
    for (const folder of folders) {
      folderStore.put(folder);
    }

    const fileStore = tx.objectStore('files');
    for (const file of files) {
      fileStore.put(file);
    }

    const trashStore = tx.objectStore('trash');
    for (const item of trash) {
      trashStore.put(item);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err: any) {
    console.warn('[IndexedDB] Save project failed, falling back to LocalStorage:', err);
    notifyStorageError({
      source: 'IndexedDB',
      operation: 'saveLocalProjectData',
      message: `IndexedDB Save Warning: ${err?.message || 'Storage write failed'}. Falling back to LocalStorage.`,
      recoverable: true,
    });
    // Fallback to localStorage if IndexedDB fails
    try {
      localStorage.setItem(`livepad_project_${project.id}`, JSON.stringify(project));
      localStorage.setItem(`livepad_folders_${project.id}`, JSON.stringify(folders));
      localStorage.setItem(`livepad_files_${project.id}`, JSON.stringify(files));
      localStorage.setItem(`livepad_trash_${project.id}`, JSON.stringify(trash));
    } catch (e: any) {
      console.warn('LocalStorage fallback quota error:', e);
      notifyStorageError({
        source: 'LocalStorage',
        operation: 'saveLocalProjectDataFallback',
        message: 'Browser storage quota exceeded. Unable to save project locally.',
        recoverable: true,
        actionHint: 'Export your project or clear unused local browser storage.',
      });
    }
  }
}

export async function loadLocalProjectData(projectId: string): Promise<{
  project: CodingProject | null;
  folders: ProjectFolder[];
  files: ProjectFile[];
  trash: TrashedItem[];
}> {
  try {
    const db = await openDB();
    const tx = db.transaction(['projects', 'folders', 'files', 'trash'], 'readonly');

    const projectReq = tx.objectStore('projects').get(projectId);
    const folderReq = tx.objectStore('folders').getAll();
    const fileReq = tx.objectStore('files').getAll();
    const trashReq = tx.objectStore('trash').getAll();

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    const project: CodingProject | null = projectReq.result || null;
    const allFolders: ProjectFolder[] = folderReq.result || [];
    const allFiles: ProjectFile[] = fileReq.result || [];
    const allTrash: TrashedItem[] = trashReq.result || [];

    const folders = allFolders.filter((f) => f.projectId === projectId);
    const files = allFiles.filter((f) => f.projectId === projectId);
    const trash = allTrash.filter((t) => t.projectId === projectId);

    if (project) {
      return { project, folders, files, trash };
    }
  } catch (err: any) {
    console.warn('[IndexedDB] Load project failed, falling back to LocalStorage:', err);
  }

  // Fallback check in localStorage
  try {
    const projectRaw = localStorage.getItem(`livepad_project_${projectId}`);
    const foldersRaw = localStorage.getItem(`livepad_folders_${projectId}`);
    const filesRaw = localStorage.getItem(`livepad_files_${projectId}`);
    const trashRaw = localStorage.getItem(`livepad_trash_${projectId}`);

    if (projectRaw && filesRaw) {
      return {
        project: JSON.parse(projectRaw),
        folders: foldersRaw ? JSON.parse(foldersRaw) : [],
        files: JSON.parse(filesRaw),
        trash: trashRaw ? JSON.parse(trashRaw) : [],
      };
    }
  } catch (e: any) {
    console.warn('[LocalStorage] Load error:', e);
  }

  return { project: null, folders: [], files: [], trash: [] };
}

export async function saveFileVersionHistoryLocal(version: FileVersion): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(['versions'], 'readwrite');
    tx.objectStore('versions').put(version);
  } catch (e: any) {
    console.warn('[IndexedDB] Failed saving version locally:', e);
    notifyStorageError({
      source: 'IndexedDB',
      operation: 'saveFileVersionHistoryLocal',
      message: `Failed to store file version locally: ${e?.message || 'Storage write failed'}`,
      recoverable: true,
    });
  }
}

export async function loadFileVersionHistoryLocal(fileId: string): Promise<FileVersion[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(['versions'], 'readonly');
    const req = tx.objectStore('versions').getAll();
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    const all: FileVersion[] = req.result || [];
    return all
      .filter((v) => v.fileId === fileId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  } catch (e: any) {
    console.warn('[IndexedDB] Failed to load file version history:', e);
    return [];
  }
}
