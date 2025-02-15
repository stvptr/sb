import { type FileSystemTree, WebContainer } from "@webcontainer/api";
import { createContext, useContext, useSyncExternalStore } from "react";

let fs: FileSystemTree = {};

const setupWebContainer = async () => {
  const wc = await WebContainer.boot();
  await wc.mount(fs);
  wc.fs.watch("/", { recursive: true }, async (e, f) => {
    console.log(e, f);
    fs = await wc.export(wc.workdir, {});
    emitChange()
    console.log(fs);
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
let listeners: (() => void)[] = [];
const emitChange = () => {
  for (let listener of listeners) {
    listener();
  }
};
const subFs = (listener: () => void) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
};
export const useFs = () => {
  return useSyncExternalStore(subFs, getFs);
};
