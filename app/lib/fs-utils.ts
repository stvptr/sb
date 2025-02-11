export const parsePath = (path: string) => {
  if (!path) throw new Error("Invalid path");
  const parts = path.split("/");
  if (!parts.length) throw new Error("Invalid path");
  const name = parts.pop()!;
  const dir = parts.join("/");
  return { parentDir: dir || null, fileOrFolderName: name };
};

