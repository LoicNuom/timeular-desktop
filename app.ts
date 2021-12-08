// Modules to control application life and create native browser window
const { checkFreeAgentToken, connectFreeAgent } = require('./freeAgent')
const { app, BrowserWindow } = require('electron')
const path = require('path')
const { ipcMain } = require('electron')
const fs = require('fs')
const EXPORT_DIRECTORY = path.join(app.getPath('userData'),'exports')
const CORRESPONDANCE_PATH = path.join(EXPORT_DIRECTORY,'matching.json')

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
      //contextIsolation: true
    },
  })

  // and load the index.html of the app.
  mainWindow.loadFile('public/index.html')

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()

  return mainWindow
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  console.log(EXPORT_DIRECTORY)
  //console.log(fs.promises.mkdir)
  if(!fs.existsSync(EXPORT_DIRECTORY)){
    await fs.promises.mkdir(EXPORT_DIRECTORY)
  }

  let win = null
  win = createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      win = createWindow()
    }
  })

  
})


// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.on('getFreeAgentToken', (event, arg) => {
  console.log('received token request')
  checkFreeAgentToken(path.join(EXPORT_DIRECTORY, 'freeagentToken.json'))
    .then(token => {
      sleep(500).then(() => {
        console.log('got token:', token)
        event.reply('freeAgentToken', JSON.stringify(token))
      })
    })
    .catch(err => {
      console.log(err)
    })
})

ipcMain.on('saveMatches', (event, arg) => {
  fs.writeFileSync(
    CORRESPONDANCE_PATH,
    arg
  )
})

ipcMain.on('getMatches', (event, arg)=>{
  if (fs.existsSync(CORRESPONDANCE_PATH)) {
    const file = fs.readFileSync(CORRESPONDANCE_PATH).toString()
    event.reply('Matches',file)
  }
})
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
try {
  require('electron-reloader')(module)
} catch (_) {}
