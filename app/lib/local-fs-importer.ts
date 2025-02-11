import type { FileSystemTree } from "@webcontainer/api";


const buildFileSystemTreeFromHandle = async (
  dirHandle: FileSystemDirectoryHandle,
): Promise<FileSystemTree> => {
  const tree: FileSystemTree = {};

  // @ts-ignore
  for await (const [name, handle] of dirHandle.entries()) {
    if (handle.kind === "directory") {
      tree[name] = {
        directory: await buildFileSystemTreeFromHandle(handle),
      };
    } else if (handle.kind === "file") {
      const file = await handle.getFile();
      const fileContent = await file.text();
      tree[name] = {
        file: {
          contents: fileContent,
        },
      };
    }
  }

  return tree;
};

export const importFromLocalSystem=async()=>{
  const dirHandle =
    // @ts-ignore
    (await window.showDirectoryPicker()) as FileSystemDirectoryHandle;
  return buildFileSystemTreeFromHandle(dirHandle)
}