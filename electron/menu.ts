import { Menu, BrowserWindow, MenuItemConstructorOptions, app, shell } from 'electron';

export function createApplicationMenu(mainWindow: BrowserWindow): Menu {
  const isMac = process.platform === 'darwin';

  const sendCommand = (command: string, data?: any) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('menu:command', command, data);
    }
  };

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [{
          label: app.name,
          submenu: [
            { role: 'about' as const },
            { type: 'separator' as const },
            { role: 'services' as const },
            { type: 'separator' as const },
            { role: 'hide' as const },
            { role: 'hideOthers' as const },
            { role: 'unhide' as const },
            { type: 'separator' as const },
            { role: 'quit' as const },
          ],
        }]
      : []),

    {
      label: '&File',
      submenu: [
        {
          label: 'New Note',
          accelerator: 'CmdOrCtrl+N',
          click: () => sendCommand('file:new-note'),
        },
        {
          label: 'New Workspace Room',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => sendCommand('workspace:new-room'),
        },
        {
          label: 'Open Document...',
          accelerator: 'CmdOrCtrl+O',
          click: () => sendCommand('file:open'),
        },
        { type: 'separator' },
        {
          label: 'Save File',
          accelerator: 'CmdOrCtrl+S',
          click: () => sendCommand('file:save'),
        },
        {
          label: 'Export Document...',
          accelerator: 'CmdOrCtrl+E',
          click: () => sendCommand('file:export'),
        },
        { type: 'separator' },
        {
          label: 'Join Workspace Room...',
          accelerator: 'CmdOrCtrl+J',
          click: () => sendCommand('workspace:join'),
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },

    {
      label: '&Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Find in Document...',
          accelerator: 'CmdOrCtrl+F',
          click: () => sendCommand('edit:find'),
        },
      ],
    },

    {
      label: '&View',
      submenu: [
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+B',
          click: () => sendCommand('view:toggle-sidebar'),
        },
        {
          label: 'Toggle Inspector Panel',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => sendCommand('view:toggle-inspector'),
        },
        {
          label: 'Toggle Code Mode',
          accelerator: 'CmdOrCtrl+Alt+C',
          click: () => sendCommand('view:toggle-code-mode'),
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },

    {
      label: '&Workspace',
      submenu: [
        {
          label: 'Workspace Settings',
          click: () => sendCommand('workspace:settings'),
        },
        {
          label: 'Invite Collaborators',
          click: () => sendCommand('workspace:invite'),
        },
        {
          label: 'Version History',
          click: () => sendCommand('workspace:history'),
        },
        { type: 'separator' },
        {
          label: 'Open AI Assistant',
          accelerator: 'CmdOrCtrl+K',
          click: () => sendCommand('workspace:ai-assistant'),
        },
      ],
    },

    {
      label: '&Code',
      submenu: [
        {
          label: 'Run Code Snippet',
          accelerator: 'CmdOrCtrl+Enter',
          click: () => sendCommand('code:run'),
        },
        {
          label: 'Open Native Terminal',
          accelerator: 'CmdOrCtrl+`',
          click: () => sendCommand('code:terminal'),
        },
        {
          label: 'Insert Snippet Template',
          click: () => sendCommand('code:snippet-template'),
        },
      ],
    },

    {
      label: '&Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [
              { type: 'separator' as const },
              { role: 'front' as const },
              { type: 'separator' as const },
              { role: 'window' as const },
            ]
          : [{ role: 'close' as const }]),
      ],
    },

    {
      label: '&Help',
      submenu: [
        {
          label: 'LivePad Documentation & Help',
          click: async () => {
            await shell.openExternal('https://github.com');
          },
        },
        {
          label: 'Keyboard Shortcuts',
          accelerator: 'CmdOrCtrl+/',
          click: () => sendCommand('help:shortcuts'),
        },
        { type: 'separator' },
        {
          label: 'About LivePad Desktop',
          click: () => sendCommand('help:about'),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  return menu;
}
