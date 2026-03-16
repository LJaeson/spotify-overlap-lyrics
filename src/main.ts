


import { ipcMain, app, BrowserWindow, Menu, dialog, nativeImage, type MenuItem, type MenuItemConstructorOptions } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { exec, spawn } from 'child_process';
// import sudo from '@vscode/sudo-prompt';
import { trustMitmproxyCert } from './lyrics-extractor/setCertTS';

import { getActiveServiceName, getAllNetworkServiceNames } from './tools';
import { chmodSync } from 'node:fs';
import Store from 'electron-store';

if (process.platform === 'darwin') {
  app.name = 'Spotify Lyrics Overlay';
}

///////////////////////////////////DB///////////////////////////////////////
interface UserPreferences {
  font_size: number;
  font_color: string;
  window_width: number;
  bg_transparency: number;
  network_service: string;
}

const defaultPreferences: UserPreferences = {
  font_size: 24,
  font_color: '#1DB954',
  window_width: 350,
  bg_transparency: 60,
  network_service: 'Wi-Fi'
};

const store = new Store<UserPreferences>({
  defaults: defaultPreferences
});

type StoreWithGetSet = {
  get: <K extends keyof UserPreferences>(key: K) => UserPreferences[K];
  set: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
};

type StoreWithStoreObject = {
  store: UserPreferences;
};

const compatibleStore = store as unknown as Partial<StoreWithGetSet & StoreWithStoreObject>;

const getDbSettings = (): UserPreferences => {
  if (typeof compatibleStore.get === 'function') {
    return {
      font_size: compatibleStore.get('font_size'),
      font_color: compatibleStore.get('font_color'),
      window_width: compatibleStore.get('window_width'),
      bg_transparency: compatibleStore.get('bg_transparency'),
      network_service: compatibleStore.get('network_service')
    };
  }

  if (compatibleStore.store) {
    return compatibleStore.store;
  }

  return defaultPreferences;
};

const updateDbSettings = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
  // 1. Update the value on disk
  if (typeof compatibleStore.set === 'function') {
    compatibleStore.set(key, value);
  } else if (compatibleStore.store) {
    compatibleStore.store = {
      ...compatibleStore.store,
      [key]: value
    };
  }
  
  // 2. Notify the frontend immediately
  // (We use store.store to send the full updated object back)
  if (mainWindow) {
    mainWindow.webContents.send('update-preference', getDbSettings());
  }
};



//UNUSEABLE
// import Database from 'better-sqlite3';

// // let Database;
// // if (app.isPackaged) {
// //   // In production, load from the Resources folder where we manually copied it
// //   Database = require(path.join(process.resourcesPath, 'better-sqlite3'));
// // } else {
// //   // In development, load from standard node_modules
// //   Database = require('better-sqlite3');
// // }

// // Get the path to the user's app data folder
// const dbPath = path.join(app.getPath('userData'), 'spotify-overlap-lyrics-preference.db');
// const db = new Database(dbPath);

// // Create your tables on startup
// // db.prepare(`
// //   DROP TABLE preference
// // `).run();

// db.prepare(`
//   CREATE TABLE IF NOT EXISTS preference (
//     id INTEGER PRIMARY KEY CHECK (id = 1),
//     font_size INTEGER NOT NULL DEFAULT 24,
//     font_color TEXT NOT NULL DEFAULT '#1DB954',
//     window_width INTEGER NOT NULL DEFAULT 350,
//     bg_transparency INTEGER NOT NULL DEFAULT 60,
//     network_service TEXT NOT NULL DEFAULT 'Wi-Fi'
//   )
// `).run();

// db.prepare(`
//   INSERT OR IGNORE INTO preference (id, font_size, font_color, window_width, bg_transparency, network_service)
//   VALUES (1, 24, '#1DB954', 350, 60, 'Wi-Fi')
// `).run();


// const getDbSettings = () => {
//   return db.prepare('SELECT * FROM preference WHERE id = 1').get();
// }

// const updateDbSettings = (key: string, value: any) => {
//   const statement = db.prepare(`UPDATE preference SET ${key} = ? WHERE id = 1`);
//   const result = statement.run(value);
//   mainWindow.webContents.send('update-preference', getDbSettings())
//   return result;
// }
////////////////////////////////////////////////////////////////////////////
// Create the browser window.
let mainWindow: BrowserWindow;

// create the local font size for drop down menu
const font_size_guide = [12, 14, 17, 20, 24, 27, 30, 36];
const bg_transparencye_guide = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const tempDbSetting = getDbSettings();
let localFontSize = tempDbSetting.font_size;
let local_bg_transparency = tempDbSetting.bg_transparency;
let local_width = tempDbSetting.window_width;

//////////////////////////////////////////////
//get service name
const service_guide: string[] = getAllNetworkServiceNames();
let curr_service: string | null = getActiveServiceName();
if (!curr_service && service_guide.includes(tempDbSetting.network_service)) {
  curr_service = tempDbSetting.network_service;
}


//////////////////////////////////////////////front end////////////////////////
// const iconPath = path.join(__dirname, '..', 'src', 'assets', 'logo_1.png');
// const image = nativeImage.createFromPath(iconPath);

const getIconPath = () => {
  if (app.isPackaged) {
    // In production, Vite usually puts extraResources in the resources folder
    return path.join(process.resourcesPath, 'assets', 'logoP.png');
  } else {
    // In development, we point directly to the source folder from the project root
    return path.join(process.cwd(), 'src', 'assets', 'logoP.png');
  }
};
const iconPath = getIconPath();
const image = nativeImage.createFromPath(iconPath);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {

  mainWindow = new BrowserWindow({
    title: "Spotify Lyrics Overlay",
    width: local_width,
    height: 200,
    transparent: true,    
    frame: false,          
    alwaysOnTop: true,     
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: image,
  });

  
  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  
  mainWindow.on('resize', () => {
    const [newWidth] = mainWindow.getSize();
    
    local_width = newWidth;
    updateDbSettings("window_width", newWidth);
  });

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};


const runSetProxy = () => {
  if (!curr_service) {
    console.error('Cannot set proxy: no active network service selected');
    return;
  }

  ////DEPRECATED
  // const scriptPath = app.isPackaged 
  //   ? path.join(process.resourcesPath, 'lyrics-extractor', 'setProxy.py') // Production
  //   : path.join(__dirname, '..', '..', 'src', 'lyrics-extractor', 'setProxy.py'); // Development (inside .vite/build/main.js)
  // 
  // exec(`python3 "${scriptPath}" "${curr_service}"`, (error, stdout, stderr) => {
  //   if (error) {
  //     console.error(`Exec error: ${error}`);
  //     return; 
  //   }
  //   console.log('set proxy scceed: ' + stdout);
  // });

  // Call the native Apple utility directly (much faster than Python)
  const cmd = `networksetup -setwebproxy "${curr_service}" 127.0.0.1 7381 && ` +
              `networksetup -setsecurewebproxy "${curr_service}" 127.0.0.1 7381`;

  exec(cmd, (err) => {
    // Close the "native-looking" window immediately when done
    
    if (err) {
      console.error("Failed to set proxy", err);
      return;
    }

    console.log(`set proxy succeed for ${curr_service}`);
  });

  // const binPath = getExtractorPath("setProxy_bin");

  // exec(`"${binPath}" "${curr_service}"`, (error, stdout, stderr) => {
  //   if (error) {
  //     console.error(`Exec error: ${error}`);
  //     return;
  //   }
  //   console.log('set proxy succeed: ' + stdout);
  // });
}

const runUnsetProxy = () => {
  if (!curr_service) {
    console.error('Cannot unset proxy: no active network service selected');
    return;
  }

  // //DEPRECATED
  // const scriptPath = app.isPackaged 
  //   ? path.join(process.resourcesPath, 'lyrics-extractor', 'unsetProxy.py') // Production
  //   : path.join(__dirname, '..', '..', 'src', 'lyrics-extractor', 'unsetProxy.py'); // Development (inside .vite/build/main.js)

  // exec(`python3 "${scriptPath}" "${curr_service}"`, (error, stdout, stderr) => {
  //   if (error) {
  //     console.error(`Exec error: ${error}`);
  //     return; 
  //   }
  //   console.log('unset proxy scceed: ' + stdout);
  // });


  const cmd = `networksetup -setwebproxystate "${curr_service}" off && ` +
              `networksetup -setsecurewebproxystate "${curr_service}" off`;

  exec(cmd, (err) => {
    // Close the "native-looking" window immediately when done
    
    if (err) {
      console.error("Failed to unset proxy", err);
      return;
    }

    console.log(`unset proxy succeed for ${curr_service}`);
  });


  // const binPath = getExtractorPath("unsetProxy_bin");

  // exec(`"${binPath}" "${curr_service}"`, (error, stdout, stderr) => {
  //   if (error) {
  //     console.error(`Exec error: ${error}`);
  //     return;
  //   }
  //   console.log('set proxy succeed: ' + stdout);
  // });

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
// app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }

});


app.whenReady().then(() => {
  // const service_guide: string[] = getAllNetworkServiceNames();
  // let curr_service: string | null = getActiveServiceName();
  if (process.platform === 'darwin') {
    app.dock.setIcon(image);
    app.name = 'Spotify Lyrics Overlay';
  }


  if (!curr_service) {
    if (service_guide.length > 0) {
      curr_service = service_guide[0];
      updateDbSettings('network_service', curr_service);

      dialog.showMessageBox({
        type: 'info',
        title: 'Proxy Setup',
        message: 'Auto-detect current network service failed',
        detail: 'The app selected the first available network service. You can change it from the context menu under "network service".',
        buttons: ['OK']
      });
    } else {
      dialog.showMessageBox({
        type: 'error',
        title: 'Proxy Setup Failed',
        message: 'No macOS network services were found',
        detail: 'The app cannot configure proxy automatically. Check System Settings > Network, then relaunch the app.',
        buttons: ['OK']
      });
    }
  }

  if (curr_service) {
    runSetProxy();
  }

  createWindow();


  //////////////////////////////////////////back end///////////////////////////
  // Determine the correct path to your python script
  // const scriptPath = app.isPackaged 
  //   ? path.join(process.resourcesPath, 'lyrics-extractor', 'extractor.py') // Production
  //   : path.join(__dirname, '..', '..', 'src', 'lyrics-extractor', 'extractor.py'); // Development (inside .vite/build/main.js)

  // const pythonProcess = spawn('python3', [scriptPath]);

  const getPythonBinaryPath = () => {
    if (app.isPackaged) {
      return path.join(process.resourcesPath, 'lyrics-extractor', 'extractor');
    } else {
      return path.join(process.cwd(), 'src', 'lyrics-extractor', 'extractor');
    }
  };

  const binaryPath = getPythonBinaryPath();

  if (app.isPackaged) {
    try {
      chmodSync(binaryPath, 0o755);
    } catch (e) {
      console.error("Failed to set permissions:", e);
    }
  }

  const pythonProcess = spawn(binaryPath);

  pythonProcess.on('error', (err) => {
    dialog.showErrorBox(
      'Extractor Startup Failed',
      'The bundled lyrics extractor could not be started. Try reinstalling the app or checking file permissions.'
    );
    console.error('Failed to start extractor process:', err);
  }); 

  // const pythonProcess = spawn('python3', [join(__dirname, '/lyrics-extractor/extractor.py')]);

  pythonProcess.stdout.on('data', (data) => {
    const text = data.toString().trim();
    // Send to the React window
    mainWindow.webContents.send('from-python', text);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python Error: ${data}`);
  });

  // Ensure Python dies when Electron quits
  //code run when the program quit
  app.on('will-quit', () => {
    // db.close();
    pythonProcess.kill();
    runUnsetProxy();
    console.log('closed');
  });

  // Optional: Handle Python exit
  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`);
  });
  /////////////////////////////////////////////////////////////////////////////

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      // If the window exists but is hidden, show it
      mainWindow.show();
    }
  });
})







//////////////////////////////////ipc////////////////////////////////




ipcMain.on('resize-window', (event, dimensions) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    // animate: true makes the OS window resize smoothly
    local_width = dimensions.width;
    updateDbSettings("window_width", dimensions.width);
    win.setSize(dimensions.width, dimensions.height, true);
  }
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.


// Listen for the right-click event from React
ipcMain.on('show-context-menu', (event) => {
  const template: MenuItemConstructorOptions[] = [
    { label: 'set cert', click: () => trustMitmproxyCert()},
    { label: 'set proxy', click: () => runSetProxy()},
    { label: 'unset proxy', click: () => runUnsetProxy()},
    {
      label: 'network service',
      submenu: service_guide.map((size) => ({
        label: `${size}`,
        type: 'radio',
        checked: curr_service === size,
        click: () => {
          runUnsetProxy();
          curr_service = size;
          updateDbSettings('network_service', size);
          runSetProxy();
        }
      }))
    },
    { type: 'separator' },
    {
      label: 'Font-size',
      submenu: font_size_guide.map((size) => ({
        label: `${size} px`,
        type: 'radio',
        checked: localFontSize === size,
        click: () => {
          updateDbSettings("font_size", size);
          localFontSize = size;
        }
      }))
    },
    {
      label: 'Background transparency',
      submenu: bg_transparencye_guide.map((size) => ({
        label: `${size}%`,
        type: 'radio',
        checked: local_bg_transparency === size,
        click: () => {
          updateDbSettings("bg_transparency", size);
          local_bg_transparency = size;
        }
      }))
    },
    { type: 'separator' },
    { label: 'Hide', click: () => {if (mainWindow) mainWindow.hide();}},
    { 
      label: 'Always on Top', 
      type: 'checkbox', 
      checked: mainWindow.isAlwaysOnTop(), 
      click: (menuItem: MenuItem) => {
        mainWindow.setAlwaysOnTop(menuItem.checked);
      } 
    },
    { type: 'separator' },
    { role: 'quit', label: 'Exit Application' }
  ];

  const menu = Menu.buildFromTemplate(template);
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) {
    menu.popup({ window });
  }
});


//db
ipcMain.handle('get-preferences', () => {
  return getDbSettings()
});

// ipcMain.handle('update-preference', (event, key: string, value: any) => {
//   return updateDbSettings(key, value)
// });
