/**
 * Code Mode & Project Explorer Data Structures
 */

export interface ProjectFolder {
  id: string;
  projectId: string;
  name: string;
  parentId: string | null; // null means root folder
  path: string; // e.g. "src/components"
  createdAt: number;
  updatedAt: number;
  isExpanded?: boolean;
}

export interface FileVersion {
  id: string;
  fileId: string;
  versionNumber: number;
  content: string;
  updatedAt: number;
  authorName: string;
  authorUid?: string;
  summary?: string;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  name: string;
  extension: string;
  language: string;
  path: string; // e.g. "src/components/Button.tsx"
  parentId: string | null; // folder ID or null for root
  content: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  updatedBy: string;
  version: number;
  isPinned?: boolean;
  isUnsaved?: boolean;
}

export interface TrashedItem {
  id: string;
  projectId: string;
  originalItem: ProjectFile | ProjectFolder;
  itemType: 'file' | 'folder';
  deletedAt: number;
  deletedBy: string;
  // If folder, sub-files & sub-folders inside it
  subFiles?: ProjectFile[];
  subFolders?: ProjectFolder[];
}

export interface CodingProject {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  activeFileId?: string | null;
  openFileIds?: string[];
  pinnedFileIds?: string[];
  settings?: {
    theme?: 'vs-dark' | 'light';
    fontSize?: number;
    tabSize?: number;
    autoSave?: boolean;
  };
}

export interface ContextMenuState {
  x: number;
  y: number;
  targetId: string | null;
  targetType: 'file' | 'folder' | 'root';
  targetPath?: string;
}

export type ExplorerSortBy = 'name' | 'type' | 'date';

export interface ProblemDiagnostic {
  id: string;
  fileId?: string;
  filePath: string;
  fileName: string;
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  source?: 'compiler' | 'linter' | 'language-server' | 'virtual-builder';
  code?: string | number;
}

