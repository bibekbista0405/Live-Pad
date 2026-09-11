# LivePad Phase 2 Data Architecture

## Canonical hierarchy

```text
workspaces/{workspaceId}
  members/{uid}
  presence/{uid}
  documents/{documentId}
  messages/{messageId}
  comments/{commentId}
  attachments/{attachmentId}
  projects/{projectId}
  history/{historyId}
  audit/{auditId}
```

The `rooms/{roomId}` tree remains the Phase 1 compatibility surface while the
application migrates. New domain code should use repository contracts and the
canonical `workspaces/*` tree rather than reading Firestore directly.

Repositories are the only place where Firestore field names, timestamps, and
collection paths are translated into domain records.
