import { type FileSystemTree, WebContainer } from "@webcontainer/api";
import { createContext, useContext, useSyncExternalStore } from "react";
import type { IDisposable } from "monaco-editor";
import * as monaco from "monaco-editor";
import { parsePath } from "~/lib/fs-utils";
import { createFs } from "~/wc/fs-tree";
import { createPreviewServers } from "~/wc/preview-servers";
import { createQueue } from "~/lib/promise-queue";
import {
  addExtraLib,
  addOrReplaceExtraLib, clearExtraLibs,
  removeExtraLib
} from "~/wc/external-libs.client";

const setupWebContainer = async () => {
  const wc = await WebContainer.boot();

  const queue = createQueue();

  wc.fs.watch(
    "",
    { recursive: true, encoding: "utf-8" },
    async (event, filename) => {

      const task = async () => {
        filename =
          typeof filename === "string"
            ? filename
            : new TextDecoder().decode(filename);

        if (filename.split("/").includes("node_modules") ) {
          if(!filename.endsWith(".d.ts")) return
          if (event === "change") {
            const fileContent = await wc.fs.readFile(filename, "utf-8");
            addOrReplaceExtraLib(fileContent, filename);
          } else if (event === "rename") {
            const { parentDir, fileOrFolderName } = parsePath(filename);
            const dir = await wc.fs.readdir(parentDir || "", {
              withFileTypes: true,
            });
            // if this readdir throws an error, it means the parent directory was deleted, so another callback will handle deletion
            const fileOrFolder = dir.find((d) => d.name === fileOrFolderName);
            if (!fileOrFolder) {
              // DELETED FILE OR FOLDER
              removeExtraLib(filename);
            } else {
              // NEW FILE
              if (fileOrFolder.isFile() && filename.endsWith(".d.ts")) {
                const fileContent = await wc.fs.readFile(filename, "utf-8");
                addExtraLib(fileContent, filename);
              } else if (fileOrFolder.isDirectory()) {
                // NEW DIRECTORY
              }
            }
          }
        } else {
          if (event === "change") {
            const fileContent = await wc.fs.readFile(filename, "utf-8");

            const model = monaco.editor.getModel(monaco.Uri.file(filename))!;
            if (model.getValue() !== fileContent) {
              model.setValue(fileContent);
            }
          } else if (event === "rename") {
            const { parentDir, fileOrFolderName } = parsePath(filename);
            const dir = await wc.fs.readdir(parentDir || "", {
              withFileTypes: true,
            });
            // if this readdir throws an error, it means the parent directory was deleted, so another callback will handle deletion
            const fileOrFolder = dir.find((d) => d.name === fileOrFolderName);
            if (!fileOrFolder) {
              // DELETED FILE OR FOLDER
              monaco.editor
                .getModels()
                .filter((model) => {
                  return (
                    model.uri.path === `/${filename}` ||
                    model.uri.path.startsWith(`/${filename}/`)
                  );
                })
                .forEach((model) => model.dispose());
              fs.rm(filename);
            } else {
              // NEW FILE
              if (fileOrFolder.isFile()) {
                const fileContent = await wc.fs.readFile(filename, "utf-8");
                monaco.editor.createModel(
                  fileContent,
                  undefined,
                  monaco.Uri.file(filename),
                );
                fs.add(filename);
              } else if (fileOrFolder.isDirectory()) {
                // NEW DIRECTORY

                fs.add(filename, {});
                const sync = async (base: string) => {
                  const children = await wc.fs.readdir(base, {
                    withFileTypes: true,
                  });
                  for (let child of children) {
                    if (child.isDirectory()) {
                      fs.add(base + "/" + child.name, {});
                      await sync(base + "/" + child.name);
                    } else {
                      fs.add(base + "/" + child.name);
                    }
                  }
                };
                await sync(filename);
              }
            }
          }
        }
      };
      queue.add(task);
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
      monaco.editor.getModels().forEach((model) => model.dispose());
      clearExtraLibs()
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
