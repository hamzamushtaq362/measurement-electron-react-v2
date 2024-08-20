/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import MeasurementSimulator from './measurementSimulator';
import { createIPCMainFunctions } from '../mainRendererShared/ipcSignatures/ipcFunctionsGenerator';
import { MeasurementsIPCName } from '../mainRendererShared/ipcSignatures/measurementsIPCSignatures';
import { IPCSignatureMap } from '../mainRendererShared/ipcSignatures/abstractIPCSignatures';

const ipcMainFunctions = createIPCMainFunctions();

let mainWindow: BrowserWindow | null = null;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let simulator: MeasurementSimulator | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1600,
    height: 900,
    icon: getAssetPath('icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      contextIsolation: true, // Enable context isolation for security
      nodeIntegration: false, // Disable nodeIntegration for security
    },
  });

  simulator = new MeasurementSimulator(mainWindow.webContents);

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('close', (e) => {
    e.preventDefault(); // Prevent default behavior of the close button
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      win.webContents.send('user-disconnect');
    }
    setTimeout(() => {
      mainWindow?.destroy(); // Close the window after handling the disconnection
    }, 1000); // Adjust the timeout as needed
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);

// Handler for 'request-new-data' IPC message
ipcMain.handle('request-new-data', async () => {
  // Simulate or retrieve data
  const data = {
    // Example data
    timestamp: new Date(),
    value: Math.random() * 100,
  };

  // Return the data to the renderer
  return data;
});

// IPC Main Process Handlers
ipcMain.handle('message-from-renderer', async (event, args) => {
  console.log(args); // Handle message from renderer process
  return 'Message received by main process';
});

// ipcMain.handle(MeasurementsIPCName.START, async (event, trackTitle) => {
//   try {
//     console.log('Received track title:', trackTitle);

//     return 'Okay'; // Return the result to the renderer process
//   } catch (error) {
//     throw new Error('An error occurred during measurements'); // Throw an error if something goes wrong
//   }
// });

// ipcMain.handle(MeasurementsIPCName.START, async (event) => {
//   console.log('Start Main');
//   return;
// });

// ipcMain.handle(MeasurementsIPCName.EXPORT_CSV, async (event) => {
//   console.log('EXPORT_CSV Main');
//   return;
// });

// ipcMain.handle(MeasurementsIPCName.EXPORT_PNG, async (event) => {
//   console.log('EXPORT_PNG Main');
//   return;
// });

// ipcMain.handle(MeasurementsIPCName.DISCONNECT, async (event) => {
//   console.log('Disconnect Main');
//   return [];
// });

// ipcMain.handle('select-connection', async (event, args) => {
//   console.log('Select Device Main');
//   return [];
// });

ipcMain.handle(MeasurementsIPCName.DISCONNECTED, async (event) => {
  console.log('Disconnected Main');
  return [];
});

// ipcMain.handle(MeasurementsIPCName.NEW_DATA, async (event) => {
//   console.log('NEW_DATA Main');
//   return [];
// });

ipcMain.handle('show-save-dialog', async (event, fileType) => {
  const fileFilters: any = {
    png: [{ name: 'Images', extensions: ['png'] }],
    csv: [{ name: 'CSV Files', extensions: ['csv'] }],
  };

  const result = await dialog.showSaveDialog({
    title: `Save ${fileType.toUpperCase()}`,
    defaultPath: path.join(__dirname, `../untitled.${fileType}`),
    filters: fileFilters[fileType] || [],
  });
  return result.filePath;
});

// const handleUserDisconnect = () => {
//   const win = BrowserWindow.getFocusedWindow();
//   console.log(win);
//   if (win) {
//     win.webContents.send('user-disconnect');
//   }
// };

// setTimeout(handleUserDisconnect, 15000);
