import { clone } from "isomorphic-git";
import { Input } from "~/components/ui/input";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import LightningFS from "@isomorphic-git/lightning-fs";
import http from "isomorphic-git/http/web";
import { useNavigate } from "react-router";
import type { FileSystemTree } from "@webcontainer/api";
import { getWebContainerP } from "~/wc/web-container.client";

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
    path: match[4] || "/",
  };
};

const buildFileSystemTree = async (
  fs: LightningFS,
  dir: string = "/",
): Promise<FileSystemTree> => {
  const tree: FileSystemTree = {};
  const entries = await fs.promises.readdir(dir);

  for (const entry of entries) {
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

const Home = () => {
  const navigate = useNavigate();
  const [gitUrl, setGitUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const handleGitClone = async () => {
    if (!gitUrl) return;

    const { repoUrl, branch, path } = parseGitUrl(gitUrl);
    const fs = new LightningFS("gitfs");
    try {
      setLoading(true);
      await clone({
        fs,
        http,
        url: repoUrl,
        ...(branch ? { ref: branch } : {}),
        dir: path,
        exclude: [".git"],
        singleBranch: true,
        depth: 1,
      });
      getWebContainerP().create(await buildFileSystemTree(fs));

      navigate("/editor");
    } catch (error) {
      console.error("Failed to clone repository:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadLocalFolder = async () => {
    try {
      setLoading(true);
      const dirHandle =
        // @ts-ignore
        (await window.showDirectoryPicker()) as FileSystemDirectoryHandle;
      getWebContainerP().create(await buildFileSystemTreeFromHandle(dirHandle));
      navigate("/editor");
    } catch (error) {
      console.error("Failed to load local folder:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartFromScratch = () => {
    try {
      navigate("/editor");
      getWebContainerP().create();
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col items-center gap-4">
      <h1>Choose a Starter Template</h1>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h2>Fetch from Git URL</h2>
          <Input
            type="text"
            value={gitUrl}
            onChange={(e) => setGitUrl(e.target.value)}
            placeholder="Enter Git URL"
          />
          <Button disabled={!gitUrl || loading} onClick={handleGitClone}>
            Clone Repository
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          <h2>Load from Local Folder</h2>
          <Button disabled={loading} onClick={handleLoadLocalFolder}>Load Folder</Button>
        </div>
        <div className="flex flex-col gap-2">
          <h2>Start from Scratch</h2>
          <Button disabled={loading} onClick={handleStartFromScratch}>Start</Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
