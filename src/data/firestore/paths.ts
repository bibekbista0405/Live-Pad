/** Canonical Phase 2 Firestore paths. */
export const workspacePath = (id: string) => `workspaces/${id}`;
export const memberPath = (workspaceId: string, uid: string) => `workspaces/${workspaceId}/members/${uid}`;
export const membersPath = (workspaceId: string) => `workspaces/${workspaceId}/members`;
export const presencePath = (workspaceId: string, uid: string) => `workspaces/${workspaceId}/presence/${uid}`;
export const presencesPath = (workspaceId: string) => `workspaces/${workspaceId}/presence`;
export const documentPath = (workspaceId: string, documentId: string) => `workspaces/${workspaceId}/documents/${documentId}`;
export const documentsPath = (workspaceId: string) => `workspaces/${workspaceId}/documents`;
export const messagePath = (workspaceId: string, messageId: string) => `workspaces/${workspaceId}/messages/${messageId}`;
export const messagesPath = (workspaceId: string) => `workspaces/${workspaceId}/messages`;
export const commentPath = (workspaceId: string, commentId: string) => `workspaces/${workspaceId}/comments/${commentId}`;
export const commentsPath = (workspaceId: string) => `workspaces/${workspaceId}/comments`;
export const projectPath = (workspaceId: string, projectId: string) => `workspaces/${workspaceId}/projects/${projectId}`;
export const projectsPath = (workspaceId: string) => `workspaces/${workspaceId}/projects`;
export const historyPath = (workspaceId: string, historyId: string) => `workspaces/${workspaceId}/history/${historyId}`;
export const historyCollectionPath = (workspaceId: string) => `workspaces/${workspaceId}/history`;
export const auditPath = (workspaceId: string, auditId: string) => `workspaces/${workspaceId}/audit/${auditId}`;
export const auditCollectionPath = (workspaceId: string) => `workspaces/${workspaceId}/audit`;
