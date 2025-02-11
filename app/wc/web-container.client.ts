import { type FileSystemTree, WebContainer } from "@webcontainer/api";
import { createContext, useContext, useSyncExternalStore } from "react";
import type { IDisposable } from "monaco-editor";
import * as monaco from "monaco-editor";
import { parsePath } from "~/lib/fs-utils";
import { createFs } from "~/wc/fs-tree";
import { createPreviewServers } from "~/wc/preview-servers";
import { createQueue } from "~/lib/promise-queue";

const disposables: { [key in string]?: IDisposable } = {};

const setupWebContainer = async () => {
  const wc = await WebContainer.boot();

  const queue = createQueue();

  wc.fs.watch(
    "",
    { recursive: true, encoding: "utf-8" },
    async (event, filename) => {
      console.log("fs event", event, filename);

      const task = async () => {
        filename =
          typeof filename === "string"
            ? filename
            : new TextDecoder().decode(filename);

        if (filename.split("/").includes("node_modules")) {
          if (event === "change") {
            disposables[filename]!.dispose();
            const fileContent = await wc.fs.readFile(filename, "utf-8");
            disposables[filename] =
              monaco.languages.typescript.typescriptDefaults.addExtraLib(
                fileContent,
                monaco.Uri.file(filename).toString(true),
              );
          } else if (event === "rename") {
            const { parentDir, fileOrFolderName } = parsePath(filename);
            const dir = await wc.fs.readdir(parentDir || "", {
              withFileTypes: true,
            });
            // if this readdir throws an error, it means the parent directory was deleted, so another callback will handle deletion
            const fileOrFolder = dir.find((d) => d.name === fileOrFolderName);
            if (!fileOrFolder) {
              // DELETED FILE OR FOLDER
              if (filename in disposables) {
                Object.entries(disposables).forEach(([key, value]) => {
                  if (key.startsWith(`${filename}/`) || key === filename) {
                    value!.dispose();
                    delete disposables[key];
                  }
                });
              }
            } else {
              // NEW FILE
              if (fileOrFolder.isFile() && filename.endsWith(".d.ts")) {
                const fileContent = await wc.fs.readFile(filename, "utf-8");
                disposables[filename] =
                  monaco.languages.typescript.typescriptDefaults.addExtraLib(
                    fileContent,
                    monaco.Uri.file(filename).toString(true),
                  );
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
  return async (fs?: FileSystemTree) => {
    if (webContainerP) return webContainerP;
    webContainerP = setupWebContainer();
    const wc = await webContainerP;
    if (fs) await wc.mount(fs);
    const teardown = wc.teardown;
    wc.teardown = () => {
      teardown.call(wc);
      webContainerP = null;
    };
    return wc;
  };
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
