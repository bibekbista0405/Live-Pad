import { describe, expect, it } from 'vitest';
import { appUIReducer, initialAppUIState } from '../state/AppUIContext';

describe('App UI state reducer', () => {
  it('keeps navigation state in one predictable state model', () => {
    const state = appUIReducer(initialAppUIState, { type: 'setNotepadViewMode', value: 'workspaces' });
    expect(state.notepadViewMode).toBe('workspaces');
    expect(state.theme).toBe(initialAppUIState.theme);
  });

  it('supports functional-style state updates through equivalent reducer actions', () => {
    const opened = appUIReducer(initialAppUIState, { type: 'setCommandPaletteOpen', value: true });
    const closed = appUIReducer(opened, { type: 'setCommandPaletteOpen', value: false });
    expect(opened.commandPaletteOpen).toBe(true);
    expect(closed.commandPaletteOpen).toBe(false);
  });

  it('resets search UI as a single domain action', () => {
    const state = {
      ...initialAppUIState,
      searchOpen: true,
      searchQuery: 'architecture',
      activeMatchIndex: 4,
    };
    const reset = appUIReducer(state, { type: 'resetSearch' });
    expect(reset.searchOpen).toBe(false);
    expect(reset.searchQuery).toBe('');
    expect(reset.activeMatchIndex).toBe(0);
  });
});
