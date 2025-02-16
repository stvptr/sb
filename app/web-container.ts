import { type FileSystemTree, WebContainer } from "@webcontainer/api";
import { createContext, useContext, useSyncExternalStore } from "react";

let fs: FileSystemTree = {};

const setupWebContainer = async () => {
  const wc = await WebContainer.boot();
  await wc.mount(fs);
  let exportTimeout: ReturnType<typeof setTimeout> | null = null;
  wc.fs.watch("/", { recursive: true }, async (e, f) => {
    // need to debounce this or not export every time but just make the specific change
    if (exportTimeout) clearTimeout(exportTimeout);
    exportTimeout = setTimeout(async () => {
      fs = await wc.export(wc.workdir, {});
      emitChange();
    }, 100);
  });
  wc.on("server-ready", (port, url) => {
    servers = [...new Set([...servers, url])];
    emitChangeServers();
    console.log(port, url);
  });
  wc.on("port", (port, action, url) => {
    console.log(port, action, url);
    if (action === "close" && servers.includes(url)) {
      servers = servers.filter((s) => s !== url);
      emitChangeServers();
    }
  });
  return wc;
};

export const getWebContainerP = (() => {
  let webContainerP: Promise<WebContainer> | null = null;
  return async () => {
    if (webContainerP) return webContainerP;
    webContainerP = setupWebContainer();
    const wc = await webContainerP;
    return wc;
  };
})();

export const WebContainerContext = createContext<WebContainer | null>(null);

export const useWebContainer = () => {
  const wc = useContext(WebContainerContext);
  if (!wc) throw new Error("WebContainer is not mounted");
  return wc;
};

const getFs = () => fs;
let fsListeners: (() => void)[] = [];
const emitChange = () => {
  for (let listener of fsListeners) {
    listener();
  }
};
const subFs = (listener: () => void) => {
  fsListeners.push(listener);
  return () => {
    fsListeners = fsListeners.filter((l) => l !== listener);
  };
};
export const useFs = () => {
  return useSyncExternalStore(subFs, getFs);
};

let servers: string[] = [];
const getServers = () => servers;
let serversListeners: (() => void)[] = [];
const emitChangeServers = () => {
  for (let listener of serversListeners) {
    listener();
  }
};
const subServers = (listener: () => void) => {
  serversListeners.push(listener);
  return () => {
    serversListeners = serversListeners.filter((l) => l !== listener);
  };
};
export const useServers = () => {
  return useSyncExternalStore(subServers, getServers);
};
