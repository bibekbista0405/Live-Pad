import { describe, expect, it } from 'vitest';
import { appUIReducer, initialAppUIState } from '../state/AppUIContext';

describe('Phase 3 application UI state boundary', () => {
  it('keeps unrelated UI state stable when one state atom changes', () => {
    const next = appUIReducer(initialAppUIState, { type: 'setSearchQuery', value: 'livepad' });
    expect(next.searchQuery).toBe('livepad');
    expect(next.theme).toBe(initialAppUIState.theme);
    expect(next.sidebarOpen).toBe(initialAppUIState.sidebarOpen);
    expect(next.isCodeMode).toBe(initialAppUIState.isCodeMode);
  });

  it('resets the search session without affecting navigation state', () => {
    const searching = appUIReducer(initialAppUIState, { type: 'setSearchOpen', value: true });
    const withQuery = appUIReducer(searching, { type: 'setSearchQuery', value: 'notes' });
    const reset = appUIReducer(withQuery, { type: 'resetSearch' });
    expect(reset.searchOpen).toBe(false);
    expect(reset.searchQuery).toBe('');
    expect(reset.activeMatchIndex).toBe(0);
    expect(reset.notepadViewMode).toBe(initialAppUIState.notepadViewMode);
  });
});
