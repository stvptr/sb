import { type FileSystemTree, WebContainer } from "@webcontainer/api";
import { createContext, useContext, useSyncExternalStore } from "react";
import { createQueue } from "~/lib/promise-queue";

let fs: FileSystemTree = {};

const setupWebContainer = async () => {
  const wc = await WebContainer.boot();
  // @ts-ignore
  window.wc = wc;

  await wc.mount(fs);
  const fsUpdatesQueue = createQueue();
  wc.fs.watch("/", { recursive: true }, async (e, f) => {
    console.log(e, f);
    fsUpdatesQueue.add(async () => {
      const filePath = typeof f === "string" ? f : new TextDecoder().decode(f);
      const folderPath = filePath.split("/").slice(0, -1).join("/");
      const folderContent = await wc.fs.readdir(folderPath, {
        withFileTypes: true,
      });
      const entry = folderContent.find(
        (f) => f.name === filePath.split("/").at(-1),
      );
      if (e === "rename") {
        if (!entry) {
          fs = { ...fs };
          const tree = filePath
            .split("/")
            .slice(0, -1)
            .reduce((acc, segment) => {
              const s = acc[segment];
              if (s && "directory" in s) return s.directory;
              else throw new Error("could not locate tree to delete");
            }, fs);
          delete tree[filePath.split("/").at(-1)!];
        } else {
          fs = { ...fs };
          const tree = filePath
            .split("/")
            .slice(0, -1)
            .reduce((acc, segment) => {
              const s = acc[segment];
              if (s && "directory" in s) return s.directory;
              else throw new Error("could not locate tree to insert");
            }, fs);
          tree[filePath.split("/").at(-1)!] = entry.isDirectory()
            ? { directory: await wc.export(filePath) }
            : { file: { contents: await wc.fs.readFile(filePath) } };
        }
      }
      if (e === "change" && entry?.isFile()) {
        fs = { ...fs };
        const content = await wc.fs.readFile(filePath);
        const tree = filePath
          .split("/")
          .slice(0, -1)
          .reduce((acc, segment) => {
            const s = acc[segment];
            if (s && "directory" in s) return s.directory;
            else throw new Error("could not locate tree to insert");
          }, fs);
        tree[filePath.split("/").at(-1)!] = { file: { contents: content } };
      }
      emitFsChanges();
    });
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

let to: NodeJS.Timeout | undefined;
const emitFsChanges = () => {
  // debounce with timeout
  if (to) clearTimeout(to);
  to = setTimeout(() => {
    for (let listener of fsListeners) {
      listener();
    }
    console.log(fs);
  }, 100);
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
