import { BrowserWindow, screen } from 'electron';
import fs from 'fs';
import path from 'path';

export interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized: boolean;
  isFullScreen: boolean;
}

export class WindowManager {
  private stateFilePath: string;
  private state: WindowState;
  private window: BrowserWindow | null = null;

  constructor(userDataPath: string) {
    this.stateFilePath = path.join(userDataPath, 'window-state.json');
    this.state = this.loadState();
  }

  private loadState(): WindowState {
    const defaultState: WindowState = {
      width: 1280,
      height: 800,
      isMaximized: false,
      isFullScreen: false,
    };

    try {
      if (fs.existsSync(this.stateFilePath)) {
        const raw = fs.readFileSync(this.stateFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        
        // Ensure bounds are within visible displays
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          const visible = screen.getAllDisplays().some(display => {
            return (
              parsed.x >= display.bounds.x &&
              parsed.y >= display.bounds.y &&
              parsed.x < display.bounds.x + display.bounds.width &&
              parsed.y < display.bounds.y + display.bounds.height
            );
          });
          if (!visible) {
            delete parsed.x;
            delete parsed.y;
          }
        }
        return { ...defaultState, ...parsed };
      }
    } catch {
      // Fallback to default
    }

    return defaultState;
  }

  public saveState(): void {
    if (!this.window) return;

    try {
      const isMaximized = this.window.isMaximized();
      const isFullScreen = this.window.isFullScreen();

      if (!isMaximized && !isFullScreen) {
        const bounds = this.window.getBounds();
        this.state.x = bounds.x;
        this.state.y = bounds.y;
        this.state.width = bounds.width;
        this.state.height = bounds.height;
      }

      this.state.isMaximized = isMaximized;
      this.state.isFullScreen = isFullScreen;

      fs.writeFileSync(this.stateFilePath, JSON.stringify(this.state, null, 2));
    } catch (e) {
      console.error('Failed to save window state:', e);
    }
  }

  public getState(): WindowState {
    return this.state;
  }

  public trackWindow(window: BrowserWindow): void {
    this.window = window;

    const saveHandler = () => this.saveState();

    window.on('resize', saveHandler);
    window.on('move', saveHandler);
    window.on('close', saveHandler);
  }
}
