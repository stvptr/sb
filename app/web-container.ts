import { type FileSystemTree, WebContainer } from "@webcontainer/api";
import { createContext, useContext, useSyncExternalStore } from "react";

let fs: FileSystemTree = {
  "index.html": {
    file: {
      contents: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>WebContainer Demo</title>
        </head>
        <body>
          <h1>Hello from WebContainer!</h1>
          <script src="./script.js"></script>
        </body>
        </html>
      `,
    },
  },
  "script.js": {
    file: {
      contents: `
        console.log('Hello from script.js');
      `,
    },
  },
  "style.css": {
    file: {
      contents: `
        body {
          font-family: Arial, sans-serif;
          background-color: #282c34;
          color: white;
        }
      `,
    },
  },
  "package.json": {
    file: {
      contents: JSON.stringify({
        name: "web-container-demo",
        version: "1.0.0",
        main: "index.js",
        scripts: {
          start: "node script.js",
        },
        dependencies: {},
      }),
    },
  },
};

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
