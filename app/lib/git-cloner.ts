import LightningFS from "@isomorphic-git/lightning-fs";
import type { FileSystemTree } from "@webcontainer/api";
import { clone } from "isomorphic-git";
import http from "isomorphic-git/http/web";

const parseGitUrl = (url: string) => {
  const urlPattern =
    /^(https:\/\/github\.com\/[^\/]+\/[^\/]+)(\/tree\/([^\/]+)(\/.*)?)?$/;
  const match = url.match(urlPattern);
  if (!match) {
    throw new Error("Invalid Git URL");
  }
  return {
    repoUrl: match[1]!,
    branch: match[3],
    // path normalization to avoid leading/trailing slashes
    path: match[4] ? match[4].replace(/^\/|\/$/g, "") : "",
  };
};

const buildFileSystemTree = async (
  fs: LightningFS,
  dir: string,
): Promise<FileSystemTree> => {
  const tree: FileSystemTree = {};
  const entries = await fs.promises.readdir(dir);

  for (const entry of entries) {
    if (entry === ".git") continue;

    const fullPath = `${dir}/${entry}`;
    const stat = await fs.promises.stat(fullPath);

    if (stat.isDirectory()) {
      tree[entry] = {
        directory: await buildFileSystemTree(fs, fullPath),
      };
    } else {
      const fileContent = await fs.promises.readFile(fullPath, "utf8");
      tree[entry] = {
        file: {
          contents: fileContent,
        },
      };
    }
  }

  return tree;
};

export const gitClone = async (gitUrl: string) => {
  const { repoUrl, branch, path } = parseGitUrl(gitUrl);
  const fs = new LightningFS("gitfs");
  await clone({
    fs,
    http,
    url: repoUrl,
    ...(branch ? { ref: branch } : {}),
    dir: "/repo",
    singleBranch: true,
    depth: 1,
    corsProxy: "https://cors.isomorphic-git.org",
  });

  if (path) {
    const targetPath = `/repo/${path}`;
    return buildFileSystemTree(fs, targetPath);
  } else {
    return buildFileSystemTree(fs, "/repo");
  }
};
