// Modules to control application life and create native browser window
const { app, BrowserWindow, desktopCapturer,ipcMain } = require("electron");
const path = require("path");

function createWindow() {
    try {
        // Create the browser window.
        const mainWindow = new BrowserWindow({
            width: 800,
            height: 170,
            webPreferences: {
                preload: path.join(__dirname, "preload.js"),
                contextIsolation: true,
            },
        });
        // and load the index.html of the app.
        mainWindow.loadFile('index.html'); // you can load any website here
        // desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
        //     for (const source of sources) {
        //         console.log('source', source);
        //         if (source.name === 'Entire screen') {
        //             mainWindow.webContents.send('SET_SOURCE', source.id)
        //             return
        //         }
        //     }
        // })
        ipcMain.on('get-desktop-stream', (event, targetWindowName) => {
            desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
                for (const source of sources) {
                    if (source.name === targetWindowName) {
                        try {
                            console.log(source)
                            const stream = await navigator.mediaDevices.getUserMedia({
                                audio: false,
                                video: {
                                    mandatory: {
                                        chromeMediaSource: 'desktop',
                                        chromeMediaSourceId: source.id
                                    }
                                }
                            });
                            event.sender.send('desktop-stream', stream);
                        } catch (e) {
                            console.error('Error accessing media devices: ', e);
                        }
                    }
                }
            });
        });
        // Open the DevTools.
        // mainWindow.webContents.openDevTools()
    }
    catch (err) {
        console.log('desktopCapturer err', err);
    }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    createWindow();

    app.on("activate", function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", function () {
    if (process.platform !== "darwin") app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.