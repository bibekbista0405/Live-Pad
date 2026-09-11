/**
 * PWA File System Access API Service
 * Allows users in modern browsers (Chrome, Edge, Opera, PWA) to open, read,
 * edit, and sync real local folders from their computer disk into LivePad IDE.
 */

import { ProjectFolder, ProjectFile } from '../types/code';

export interface LocalFolderSyncResult {
  projectName: string;
  folders: ProjectFolder[];
  files: ProjectFile[];
  directoryHandle: any;
  fileHandlesMap: Map<string, any>; // file.id -> FileSystemFileHandle
}

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

export async function openLocalDirectory(projectId: string): Promise<LocalFolderSyncResult | null> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API is not supported in this browser. Try Chrome, Edge, or install LivePad as a PWA.');
  }

  try {
    const directoryHandle = await (window as any).showDirectoryPicker({
      mode: 'readwrite'
    });

    const projectName = directoryHandle.name || 'Local Directory';
    const folders: ProjectFolder[] = [];
    const files: ProjectFile[] = [];
    const fileHandlesMap = new Map<string, any>();

    const processEntries = async (
      dirHandle: any,
      parentFolderId: string | null,
      currentPath: string
    ) => {
      for await (const [name, handle] of dirHandle.entries()) {
        // Skip hidden files/folders like .git or node_modules for performance
        if (name.startsWith('.') || name === 'node_modules' || name === 'dist' || name === 'build') {
          continue;
        }

        const itemPath = currentPath ? `${currentPath}/${name}` : name;

        if (handle.kind === 'directory') {
          const folderId = `fld-local-${Math.random().toString(36).substring(2, 9)}`;
          const folderObj: ProjectFolder = {
            id: folderId,
            projectId,
            name,
            parentId: parentFolderId,
            path: itemPath,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isExpanded: true
          };
          folders.push(folderObj);

          await processEntries(handle, folderId, itemPath);
        } else if (handle.kind === 'file') {
          try {
            const fileData = await handle.getFile();
            // Only read standard text/code files (limit size < 3MB)
            if (fileData.size > 3 * 1024 * 1024) continue;

            const text = await fileData.text();
            const parts = name.split('.');
            const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : '';
            const language = getLanguageFromExt(ext, name);

            const fileId = `file-local-${Math.random().toString(36).substring(2, 9)}`;
            const fileObj: ProjectFile = {
              id: fileId,
              projectId,
              name,
              extension: ext,
              language,
              path: itemPath,
              parentId: parentFolderId,
              content: text,
              createdAt: fileData.lastModified || Date.now(),
              updatedAt: fileData.lastModified || Date.now(),
              createdBy: 'Local Disk',
              updatedBy: 'Local Disk',
              version: 1
            };

            files.push(fileObj);
            fileHandlesMap.set(fileId, handle);
          } catch (fileErr) {
            console.warn(`Could not read local file ${name}:`, fileErr);
          }
        }
      }
    };

    await processEntries(directoryHandle, null, '');

    return {
      projectName,
      folders,
      files,
      directoryHandle,
      fileHandlesMap
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return null; // User cancelled directory picker dialog
    }
    throw err;
  }
}

export async function saveFileToLocalDisk(fileHandle: any, content: string): Promise<boolean> {
  if (!fileHandle) return false;
  try {
    // Request permission if not already granted
    if ((await fileHandle.queryPermission({ mode: 'readwrite' })) !== 'granted') {
      const status = await fileHandle.requestPermission({ mode: 'readwrite' });
      if (status !== 'granted') return false;
    }

    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    return true;
  } catch (err) {
    console.error('Failed to write directly to local disk:', err);
    return false;
  }
}

function getLanguageFromExt(ext: string, name: string): string {
  const e = ext.toLowerCase();
  if (e === 'ts' || e === 'tsx') return 'typescript';
  if (e === 'js' || e === 'jsx' || e === 'mjs' || e === 'cjs') return 'javascript';
  if (e === 'html' || e === 'htm') return 'html';
  if (e === 'css' || e === 'scss' || e === 'less') return 'css';
  if (e === 'json') return 'json';
  if (e === 'py') return 'python';
  if (e === 'md' || e === 'markdown') return 'markdown';
  if (e === 'sql') return 'sql';
  if (e === 'xml' || e === 'svg') return 'xml';
  if (e === 'sh' || e === 'bash') return 'shell';
  if (name.toLowerCase() === 'dockerfile') return 'dockerfile';
  return 'plaintext';
}
