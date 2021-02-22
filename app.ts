// Modules to control application life and create native browser window
const { checkFreeAgentToken, connectFreeAgent } = require('./freeAgent')
const { app, BrowserWindow } = require('electron')
const path = require('path')
const { ipcMain } = require('electron')

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
    },
  })

  // and load the index.html of the app.
  mainWindow.loadFile('public/index.html')

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  return mainWindow
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  let win = null
  win = createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      win = createWindow()
    }
  })

  checkFreeAgentToken()
    .then(token => {
      sleep(2000).then(() => {
        console.log('got token:', token)
        win.webContents.send('freeAgentToken', JSON.stringify(token))
      })
    })
    .catch(err => {
      console.log(err)
    })
})

app.on('reload', function () {
  console.log('window reloaded')
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
try {
  require('electron-reloader')(module)
} catch (_) {}
