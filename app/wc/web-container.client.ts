import {
  type FileSystemTree,
  type FSWatchCallback,
  WebContainer,
} from "@webcontainer/api";
import { createContext, useContext, useSyncExternalStore } from "react";
import { parsePath } from "~/lib/fs-utils";
import { createFs } from "~/wc/fs-tree";
import { createPreviewServers } from "~/wc/preview-servers";
import { createQueue } from "~/lib/promise-queue";
import {
  addExtraLib,
  clearExtraLibs,
  removeExtraLib,
} from "~/wc/external-libs.client";
import {
  clearModels,
  createModel,
  removeModels,
  updateModel,
} from "~/wc/models.client";
import { printDev } from "~/lib/dev";

const setupWebContainer = async () => {
  const wc = await WebContainer.boot();

  const queue = createQueue();

  const handleFileEvent: FSWatchCallback = async (event, filename) => {
    filename =
      typeof filename === "string"
        ? filename
        : new TextDecoder().decode(filename);

    const handle = async ({
      onFileChanged,
      onNewOrRenamedFile,
      onNewOrRenamedDirectory,
      onFileOrDirectoryRemoved,
    }: {
      onFileChanged: () => Promise<void>;
      onFileOrDirectoryRemoved: () => Promise<void>;
      onNewOrRenamedFile: () => Promise<void>;
      onNewOrRenamedDirectory: () => Promise<void>;
    }) => {
      if (event === "change") {
        await onFileChanged();
      }
      if (event === "rename") {
        const { parentDir, fileOrFolderName } = parsePath(filename);
        const dir = await wc.fs.readdir(parentDir || "", {
          withFileTypes: true,
        });
        // if this readdir throws an error, it means the parent directory was deleted, so another callback will handle deletion
        const fileOrFolder = dir.find((d) => d.name === fileOrFolderName);
        if (!fileOrFolder) {
          await onFileOrDirectoryRemoved();
        } else {
          if (fileOrFolder.isFile()) {
            await onNewOrRenamedFile();
          } else if (fileOrFolder.isDirectory()) {
            await onNewOrRenamedDirectory();
          }
        }
      }
    };

    const isNodeModules = filename.split("/").includes("node_modules");

    // TODO improve this part
    /**
     * We assume here that files in node_modules never change, folders are never renamed
     *
     * Also files sync could be further optimized ...
     */
    if (isNodeModules) {
      if (filename.endsWith(".d.ts")) {
        await handle({
          onNewOrRenamedFile: async () => {
            const fileContent = await wc.fs.readFile(filename, "utf-8");
            addExtraLib(fileContent, filename);
          },
          onFileOrDirectoryRemoved: async () => {
            removeExtraLib(filename);
          },
          onFileChanged: async () => {},
          onNewOrRenamedDirectory: async () => {},
        });
      }
    } else {
      await handle({
        onFileChanged: async () => {
          const fileContent = await wc.fs.readFile(filename, "utf-8");
          updateModel(filename, fileContent);
        },
        onNewOrRenamedFile: async () => {
          if (!fs.exists(filename)) {
            createModel(filename, await wc.fs.readFile(filename, "utf-8"));
            fs.add(filename);
          }
        },
        onNewOrRenamedDirectory: async () => {
          if (!fs.exists(filename)) {
            fs.add(filename, {});
            const sync = async (base: string) => {
              const children = await wc.fs.readdir(base, {
                withFileTypes: true,
              });
              for (let child of children) {
                const path = base + "/" + child.name;
                if (child.isDirectory()) {
                  fs.add(path, {});
                  await sync(path);
                } else {
                  createModel(path, await wc.fs.readFile(path, "utf-8"));
                  fs.add(path);
                }
              }
            };
            await sync(filename);
          }
        },
        onFileOrDirectoryRemoved: async () => {
          removeModels(filename);
          fs.rm(filename);
        },
      });
    }
    printDev("task done");
  };

  wc.fs.watch(
    "",
    { recursive: true, encoding: "utf-8" },
    async (event, filename) => {
      printDev(event, filename);
      queue.add(async () => handleFileEvent(event, filename));
    },
  );

  wc.on("port", (port, action, url) => {
    if (action === "close") {
      servers.rm(url);
    } else if (action === "open") {
      servers.add(url);
    }
  });
  return wc;
};

export const getWebContainerP = (() => {
  let webContainerP: Promise<WebContainer> | null = null;

  const get = async () => {
    if (webContainerP) return webContainerP;
    webContainerP = setupWebContainer();
    const wc = await webContainerP;
    const teardown = wc.teardown;
    wc.teardown = () => {
      teardown.call(wc);
      webContainerP = null;
      servers.clear();
      fs.clear();
      clearModels();
      clearExtraLibs();
    };
    return wc;
  };

  const dispose = async () => {
    if (webContainerP) {
      const wc = await webContainerP;
      wc.teardown();
    }
  };

  const create = async (fs?: FileSystemTree) => {
    await dispose();
    const wc = await get();
    if (fs) await wc.mount(fs);
    return wc;
  };

  return () => ({
    get,
    dispose,
    create,
  });
})();

export const WebContainerContext = createContext<WebContainer | null>(null);
export const useWebContainer = () => {
  const wc = useContext(WebContainerContext);
  if (!wc) throw new Error("WebContainer is not mounted");
  return wc;
};

const fs = createFs();
export const useFs = () => {
  return useSyncExternalStore(fs.subFs, fs.getTree);
};

const servers = createPreviewServers();
export const useServers = () => {
  return useSyncExternalStore(servers.subServers, servers.getServers);
};
