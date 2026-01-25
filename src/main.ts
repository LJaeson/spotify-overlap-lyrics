import { ipcMain, app, BrowserWindow, Menu, dialog} from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { exec, spawn } from 'child_process';
import { join } from 'path';
// import sudo from '@vscode/sudo-prompt';
import { trustMitmproxyCert } from './lyrics-extractor/setCertTS';

import { getActiveServiceName, getAllNetworkServiceNames } from './tools';


///////////////////////////////////DB///////////////////////////////////////
import Database from 'better-sqlite3';

// Get the path to the user's app data folder
const dbPath = path.join(app.getPath('userData'), 'spotify-overlap-lyrics-preference.db');
const db = new Database(dbPath);

// Create your tables on startup
// db.prepare(`
//   DROP TABLE preference
// `).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS preference (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    font_size INTEGER NOT NULL DEFAULT 24,
    font_color TEXT NOT NULL DEFAULT '#1DB954',
    window_width INTEGER NOT NULL DEFAULT 350,
    bg_transparency INTEGER NOT NULL DEFAULT 60,
    network_service TEXT NOT NULL DEFAULT 'Wi-Fi'
  )
`).run();

db.prepare(`
  INSERT OR IGNORE INTO preference (id, font_size, font_color, window_width, bg_transparency, network_service)
  VALUES (1, 24, '#1DB954', 350, 60, 'Wi-Fi')
`).run();


const getDbSettings = () => {
  return db.prepare('SELECT * FROM preference WHERE id = 1').get();
}

const updateDbSettings = (key: string, value: any) => {
  const statement = db.prepare(`UPDATE preference SET ${key} = ? WHERE id = 1`);
  const result = statement.run(value);
  mainWindow.webContents.send('update-preference', getDbSettings())
  return result;
}
////////////////////////////////////////////////////////////////////////////
// Create the browser window.
let mainWindow: BrowserWindow;

// create the local font size for drop down menu
const font_size_guide = [12, 14, 17, 20, 24, 27, 30, 36];
const bg_transparencye_guide = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const tempDbSetting:any = getDbSettings();
let localFontSize = tempDbSetting.font_size;
let local_bg_transparency = tempDbSetting.bg_transparency;
let local_width = tempDbSetting.window_width;

//////////////////////////////////////////////
//get service name
const service_guide: string[] = getAllNetworkServiceNames();
let curr_service: string | null = getActiveServiceName();

// if (!curr_service) {
//   // curr_service = (tempDbSetting.network_service)? tempDbSetting.network_service : service_guide[0];
//   curr_service =  service_guide[0];
//   dialog.showMessageBox({
//     type: 'info',
//     title: 'Proxy Setup',
//     message: 'Auto-detect current service failed',
//     detail: 'Please manually select or confirm the current network service and try set proxy again',
//     buttons: ['OK']
//   });
// }


//////////////////////////////////////////////front end////////////////////////
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {

  mainWindow = new BrowserWindow({
    width: local_width,
    height: 200,
    transparent: true,    
    frame: false,          
    alwaysOnTop: true,     
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    // icon: path.join(__dirname, 'assets/icons/icon.png')
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
    const [newWidth, newHeight] = mainWindow.getSize();
    
    local_width = newWidth;
    updateDbSettings("window_width", newWidth);
  });

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};


const runSetProxy = () => {
  const scriptPath = app.isPackaged 
    ? path.join(process.resourcesPath, 'lyrics-extractor', 'setProxy.py') // Production
    : path.join(__dirname, '..', '..', 'src', 'lyrics-extractor', 'setProxy.py'); // Development (inside .vite/build/main.js)

  exec(`python3 "${scriptPath}" "${curr_service}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Exec error: ${error}`);
      return; 
    }
    console.log('set proxy scceed: ' + stdout);
  });
  // const pythonProcess = spawn('python3', [scriptPath]);
}

const runUnsetProxy = () => {

  const scriptPath = app.isPackaged 
    ? path.join(process.resourcesPath, 'lyrics-extractor', 'unsetProxy.py') // Production
    : path.join(__dirname, '..', '..', 'src', 'lyrics-extractor', 'unsetProxy.py'); // Development (inside .vite/build/main.js)

  exec(`python3 "${scriptPath}" "${curr_service}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Exec error: ${error}`);
      return; 
    }
    console.log('unset proxy scceed: ' + stdout);
  });
  // const pythonProcess = spawn('python3', [scriptPath]);

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


  if (!curr_service) {
    curr_service = service_guide[0];

    dialog.showMessageBox({
      type: 'info',
      title: 'Proxy Setup',
      message: 'Auto-detect current network service failed',
      detail: 'Please manually select or confirm the current network service by select the correct network service in "network services" drop down menu',
      buttons: ['OK']
    });
  }


  runSetProxy();

  createWindow();


  //////////////////////////////////////////back end///////////////////////////
  // Determine the correct path to your python script
  const scriptPath = app.isPackaged 
    ? path.join(process.resourcesPath, 'lyrics-extractor', 'extractor.py') // Production
    : path.join(__dirname, '..', '..', 'src', 'lyrics-extractor', 'extractor.py'); // Development (inside .vite/build/main.js)

  const pythonProcess = spawn('python3', [scriptPath]);

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
  const template = [
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
      click: (menuItem: any) => {
        mainWindow.setAlwaysOnTop(menuItem.checked);
      } 
    },
    { type: 'separator' },
    { role: 'quit', label: 'Exit Application' }
  ];

  const menu = Menu.buildFromTemplate(template as any);
  menu.popup(BrowserWindow.fromWebContents(event.sender) as any);
});


//db
ipcMain.handle('get-preferences', () => {
  return getDbSettings()
});

// ipcMain.handle('update-preference', (event, key: string, value: any) => {
//   return updateDbSettings(key, value)
// });
