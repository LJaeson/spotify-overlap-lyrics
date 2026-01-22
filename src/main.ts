import { ipcMain, app, BrowserWindow, Menu} from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { exec, spawn } from 'child_process';
import { join } from 'path';
import sudo from '@vscode/sudo-prompt';
import { trustMitmproxyCert } from './lyrics-extractor/setCertTS';

// Create the browser window.
let mainWindow: BrowserWindow;



//////////////////////////////////////////////front end////////////////////////
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {

  mainWindow = new BrowserWindow({
    width: 400,
    height: 200,
    transparent: true,    
    frame: false,          
    alwaysOnTop: true,     
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  
  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};


const runSetProxy = () => {
  const scriptPath = app.isPackaged 
    ? path.join(process.resourcesPath, 'lyrics-extractor', 'setProxy.py') // Production
    : path.join(__dirname, '..', '..', 'src', 'lyrics-extractor', 'setProxy.py'); // Development (inside .vite/build/main.js)

  exec(`python3 "${scriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Exec error: ${error}`);
      return; 
    }
    console.log('Output: ' + stdout);
  });
  // const pythonProcess = spawn('python3', [scriptPath]);
}

const runSetCert = () => {
  const scriptPath = app.isPackaged 
    ? path.join(process.resourcesPath, 'lyrics-extractor', 'setCert.py') // Production
    : path.join(__dirname, '..', '..', 'src', 'lyrics-extractor', 'setCert.py'); // Development (inside .vite/build/main.js)

  const options = {
    name: 'Spotify Lyrics Extractor',
  };

  const command = `/usr/bin/python3 -I "${scriptPath}"`;

  // Explicitly call python3 via sudo-prompt
  sudo.exec(command, options, (error, stdout, stderr) => {
    if (error) {
      console.error('Sudo error:', error);
      return;
    }
    console.log('Sudo Output: ' + stdout);
  });
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
    console.log('Running my custom cleanup code...');
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
    }
  });
})

ipcMain.on('resize-window', (event, dimensions) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    // animate: true makes the OS window resize smoothly
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
    {
      label: 'Lyrics Settings',
      submenu: [
        { label: 'Adjust Delay', click: () => console.log('Delay clicked') },
        { label: 'Reset Timer', click: () => console.log('Reset clicked') }
      ]
    },
    { type: 'separator' },
    { label: 'Always on Top', type: 'checkbox', checked: true },
    { type: 'separator' },
    { role: 'quit', label: 'Exit Application' }
  ];

  const menu = Menu.buildFromTemplate(template as any);
  menu.popup(BrowserWindow.fromWebContents(event.sender) as any);
});

