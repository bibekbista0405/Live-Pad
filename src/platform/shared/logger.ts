export type LogCategory =
  | 'Browser Logs'
  | 'Electron Logs'
  | 'Firestore Logs'
  | 'Platform Logs'
  | 'Workspace Logs'
  | 'IDE Logs';

export class Logger {
  private static debugMode: boolean = process.env.NODE_ENV !== 'production';

  public static setDebugMode(enabled: boolean): void {
    Logger.debugMode = enabled;
  }

  public static debug(category: LogCategory, message: string, data?: any): void {
    if (!Logger.debugMode) return;
    const timestamp = new Date().toISOString().substring(11, 19);
    console.debug(`[${timestamp}] [DEBUG] [${category}] ${message}`, data !== undefined ? data : '');
  }

  public static info(category: LogCategory, message: string, data?: any): void {
    const timestamp = new Date().toISOString().substring(11, 19);
    console.info(`[${timestamp}] [INFO] [${category}] ${message}`, data !== undefined ? data : '');
  }

  public static warn(category: LogCategory, message: string, data?: any): void {
    const timestamp = new Date().toISOString().substring(11, 19);
    console.warn(`[${timestamp}] [WARN] [${category}] ${message}`, data !== undefined ? data : '');
  }

  public static error(category: LogCategory, message: string, error?: any): void {
    const timestamp = new Date().toISOString().substring(11, 19);
    console.error(`[${timestamp}] [ERROR] [${category}] ${message}`, error !== undefined ? error : '');
  }
}
