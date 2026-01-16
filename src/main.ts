import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { spawn } from 'child_process';
import { join } from 'path';

// Create the browser window.
let mainWindow: BrowserWindow;



//////////////////////////////////////////////front end////////////////////////
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
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
  mainWindow.webContents.openDevTools();
};

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
  app.on('will-quit', () => {
    pythonProcess.kill();
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


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
