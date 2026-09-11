var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// electron/preload.ts
var preload_exports = {};
module.exports = __toCommonJS(preload_exports);
var import_electron = require("electron");
var electronBridge = {
  getPlatformInfo: () => import_electron.ipcRenderer.invoke("app:getPlatformInfo"),
  openFolder: () => import_electron.ipcRenderer.invoke("dialog:openFolder"),
  saveFile: (content, defaultName, filters) => import_electron.ipcRenderer.invoke("dialog:saveFile", { content, defaultName, filters }),
  readFile: (filePath) => import_electron.ipcRenderer.invoke("dialog:readFile", filePath),
  showNotification: (title, body, icon) => import_electron.ipcRenderer.invoke("notification:show", { title, body, icon }),
  openExternal: (url) => import_electron.ipcRenderer.invoke("shell:openExternal", url),
  openTerminal: (workingDir) => import_electron.ipcRenderer.invoke("terminal:open", workingDir),
  windowControl: (action) => import_electron.ipcRenderer.invoke("window:control", action),
  getNativeStorage: (key) => import_electron.ipcRenderer.invoke("storage:get", key),
  setNativeStorage: (key, value) => import_electron.ipcRenderer.invoke("storage:set", { key, value }),
  onMenuCommand: (callback) => {
    const handler = (_event, command, data) => callback(command, data);
    import_electron.ipcRenderer.on("menu:command", handler);
    return () => {
      import_electron.ipcRenderer.removeListener("menu:command", handler);
    };
  }
};
import_electron.contextBridge.exposeInMainWorld("livepadElectron", electronBridge);
