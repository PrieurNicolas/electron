// Modules to control application life and create native browser window
const { app, BrowserWindow, session, Notification } = require("electron");
const path = require("path");
const { ipcMain } = require("electron");
const { net } = require("electron");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const axios = require("axios");
const got = (...args) => import("got").then(({ default: got }) => got(...args));
const { dialog } = require("electron");
require('update-electron-app')({
  updateInterval: '1 hour',
})

var mainWindow;
let icounter = 0;
function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: "Animaux",
    icon: "assets/icon.ico",
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "./preload.js"),
    },
  });

  // and load the index.html of the app.
  mainWindow.setMenu(null);
  mainWindow.loadFile("./views/home/index.html");

  let wc = mainWindow.webContents;
  wc.openDevTools()

  // wc.on("dom-ready", (e) => {
  //   dialog.showMessageBox(
  //     (options = {
  //       message: "Hi! I got called from a WebContents Object",
  //       title: "This is a message",
  //     })
  //   ).then((res) => {
  //     console.log(res);
  //   });
  // });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
const NOTIFICATION_TITLE = 'Animaux'
const NOTIFICATION_BODY = 'Application ouverte !'

app.whenReady().then(() => {
  createWindow();
  mainWindow.maximize();
  new Notification({ title: NOTIFICATION_TITLE, body: NOTIFICATION_BODY }).show()

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

ipcMain.handle("doSomethingFetch", async () => {
  const response = await axios.get("https://random.dog/woof.json");
  return response;
});

ipcMain.handle("doSomethingGot", async () => {
  const response = await got.get("https://random.dog/woof.json");
  console.log(response);
  return response;
});

ipcMain.handle("doSomethingAxios", async () => {
  const response = await fetch("https://random.dog/woof.json");
  const body = await response.text();
  return body;
});

ipcMain.handle("doSomething", () => {
  const request = net.request("https://random.dog/woof.json");
  request.on("response", (response) => {
    const data = [];
    response.on("data", (chunk) => {
      data.push(chunk);
      console.log(chunk);
    });
    response.on("end", () => {
      const json = Buffer.concat(data).toString();
      console.log(json);
      mainWindow.webContents.send("gotData", json);
    });
  });

  request.end();
});
