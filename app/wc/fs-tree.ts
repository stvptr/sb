import _ from "lodash";
import { parsePath } from "~/lib/fs-utils";

export type FsTree = { [key in string]?: null | FsTree };

export const createFs = () => {
  let fsListeners: (() => void)[] = [];
  const subFs = (listener: () => void) => {
    fsListeners.push(listener);
    return () => {
      fsListeners = fsListeners.filter((l) => l !== listener);
    };
  };

  const emitFsChanges = (() => {
    let to: NodeJS.Timeout | undefined;
    return () => {
      if (to) clearTimeout(to);
      to = setTimeout(() => {
        for (let listener of fsListeners) {
          listener();
        }
      }, 100);
    };
  })();

  let fs: FsTree = {};

  const add = (path: string, tree?: FsTree | null) => {
    tree ||= null;
    const { parentDir, fileOrFolderName } = parsePath(path);
    fs = _.cloneDeep(fs);

    let dir = fs;
    if (parentDir) {
      for (let part of parentDir.split("/")) {
        if (dir[part] === null) {
          throw new Error("Invalid path");
        } else if (!dir[part]) {
          dir[part] = {};
        }
        dir = dir[part];
      }
    }
    dir[fileOrFolderName] = tree;
    emitFsChanges();
  };

  const rm = (path: string) => {
    const { parentDir, fileOrFolderName } = parsePath(path);
    fs = _.cloneDeep(fs);

    let dir = fs;
    if (parentDir) {
      for (let part of parentDir.split("/")) {
        if (!dir[part]) throw new Error("Invalid path");
        dir = dir[part];
      }
    }
    if (!(fileOrFolderName in dir)) throw new Error("Invalid path");
    delete dir[fileOrFolderName];
    emitFsChanges();
  };

  const exists = (path: string) => {
    const { parentDir, fileOrFolderName } = parsePath(path);

    let dir = fs;
    if (parentDir) {
      for (let part of parentDir.split("/")) {
        if (dir[part] === null) {
          return false;
        } else if (!dir[part]) {
          return false;
        }
        dir = dir[part];
      }
    }
    return dir[fileOrFolderName] !== undefined;
  };

  const clear = () => {
    fs = {};
    emitFsChanges();
  };

  return {
    add,
    exists,
    rm,
    clear,
    getTree: () => fs,
    subFs,
  };
};
