# Application layer

This directory contains user-intent/application commands that coordinate domain actions, persistence-facing hooks, navigation, and UI feedback.

Phase 3 starts with workspace lifecycle commands. The layer is intentionally thin: persistence and authorization remain in their existing services/hooks, while App-level orchestration moves here incrementally.
