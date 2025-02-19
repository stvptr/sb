import type { FileSystemTree } from "@webcontainer/api";
import {
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Folder,
  Plus,
} from "lucide-react";
import { type DragEvent, useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { useFs, useWebContainer } from "~/web-container";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

type FileNodeProps = {
  name: string;
  path: string;
  node: FileSystemTree[string];
  onMove: (from: string, to: string | null) => void;
};

const isDirectory = (node: FileSystemTree[string]) => "directory" in node;

const FileNode = ({
  name,
  path,
  node,
  setCurrentFile,
  currentFile,
  onMove,
}: FileNodeProps & FilesPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDragStart = (e: DragEvent, itemPath: string) => {
    // e.dataTransfer.setData("text/plain", itemPath);
    console.log("drag start", e, itemPath);
  };

  const handleDrop = (e: DragEvent, targetPath: string) => {
    console.log("drop", e, targetPath);
    // e.preventDefault();
    // const sourcePath = e.dataTransfer.getData("text/plain");
    // if (sourcePath && sourcePath !== targetPath) {
    //   onMove(sourcePath, targetPath);
    // }
  };

  const isDir = isDirectory(node);
  const fullPath = path ? `${path}/${name}` : name;

  return (
    <div
      className="pl-4"
      draggable
      // onDragStart={(e) => handleDragStart(e, path)}
      // onDragOver={(e) => e.preventDefault()}
      // onDrop={(e) => handleDrop(e, isDir ? `${path}/${name}` : path)}
    >
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {isDir ? (
            <div
              className="flex w-fit cursor-pointer items-center space-x-2"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <Folder size={16} className="text-yellow-500" />
              <span>{name}</span>
            </div>
          ) : (
            <div
              className={cn(
                "flex cursor-pointer items-center space-x-2",
                fullPath === currentFile && "bg-gray-200",
              )}
              onClick={() => setCurrentFile(fullPath)}
            >
              <FileText size={16} className="text-blue-500" />
              <span>{name}</span>
            </div>
          )}
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            onSelect={() =>
              onMove(
                fullPath,
                [...fullPath.split("/").slice(0, -1), "renamed.js"].join("/"),
              )
            }
          >
            Rename
          </ContextMenuItem>
          <ContextMenuItem
            onSelect={() => onMove(fullPath, null)}
            className="text-red-500"
          >
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {isOpen && isDir && (
        <div className="pl-4">
          {Object.entries(node.directory).map(([childName, childNode]) => (
            <FileNode
              key={childName}
              name={childName}
              path={fullPath}
              setCurrentFile={setCurrentFile}
              currentFile={currentFile}
              node={childNode}
              onMove={onMove}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileTree = ({
  tree,
  setCurrentFile,
  currentFile,
}: { tree: FileSystemTree } & FilesPanelProps) => {
  const wc = useWebContainer();

  const handleMove = (from: string, to: string | null) => {
    if (!to) {
      wc.fs.rm(from, { recursive: true });
    } else {
      wc.fs.rename(from, to);
    }
  };

  return (
    <div className="h-full overflow-auto p-2">
      {Object.entries(tree)
        .sort(([aName, aNode], [bName, bNode]) =>
          isDirectory(aNode) && !isDirectory(bNode)
            ? -1
            : isDirectory(bNode) && !isDirectory(aNode)
              ? 1
              : aName.localeCompare(bName),
        )
        .map(([name, node]) => (
          <FileNode
            key={name}
            name={name}
            path={""}
            setCurrentFile={setCurrentFile}
            currentFile={currentFile}
            node={node}
            onMove={handleMove}
          />
        ))}
    </div>
  );
};

type FilesPanelProps = {
  currentFile: string | null;
  setCurrentFile: (
    value: ((prevState: string | null) => string | null) | string | null,
  ) => void;
};

const FilesPanel = ({ currentFile, setCurrentFile }: FilesPanelProps) => {
  const fs = useFs();
  const wc = useWebContainer();
  const [isCreating, setIsCreating] = useState<false | "file" | "folder">(
    false,
  );
  return (
    <div className="h-full">
      <div className="mb-4 flex justify-end gap-4 p-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            wc
              .export("", { format: "zip", excludes: ["node_modules"] })
              .then((zip) => {
                const blob = new Blob([zip], { type: "application/zip" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "export.zip";
                a.click();
                URL.revokeObjectURL(url);
              })
          }
        >
          <Download />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Plus />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setIsCreating("file")}>
              File
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsCreating("folder")}>
              Folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Dialog
          open={!!isCreating}
          onOpenChange={(e) => {
            if (e === false) setIsCreating(false);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="capitalize">New {isCreating}</DialogTitle>
              <form
                className="mt-8 flex flex-col gap-2"
                action={async (form) => {
                  const filename = form.get("filename");
                  if (typeof filename === "string") {
                    if(isCreating === "folder") {
                      await wc.fs.mkdir(filename, { recursive: true });
                    }
                    if (isCreating === "file") {
                      await wc.fs.mkdir(filename.split("/").slice(0, -1).join("/"), {
                        recursive: true,
                      });
                      await wc.fs.writeFile(filename, "");
                    }
                    setIsCreating(false);
                  }
                }}
              >
                <Input type="text" name="filename" required />
                <Button type="submit" className="mt-4 w-fit">
                  Create
                </Button>
              </form>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
      <FileTree
        tree={fs}
        currentFile={currentFile}
        setCurrentFile={setCurrentFile}
      />
    </div>
  );
};

export default FilesPanel;
