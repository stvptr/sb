import type { FileSystemTree } from "@webcontainer/api";
import { ChevronDown, ChevronRight, FileText, Folder } from "lucide-react";
import { type DragEvent, useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { useFs } from "~/web-container";
import { cn } from "~/lib/utils";

type FileNodeProps = {
  name: string;
  path: string;
  node: FileSystemTree[string];
  onRename: (path: string) => void;
  onDelete: (path: string) => void;
  onMove: (from: string, to: string) => void;
};

const isDirectory = (node: FileSystemTree[string]) => "directory" in node;

const FileNode = ({
  name,
  path,
  node,
  onRename,
  setCurrentFile,
  onDelete,
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
          <ContextMenuItem onSelect={() => onRename(path)}>
            Rename
          </ContextMenuItem>
          <ContextMenuItem
            onSelect={() => onDelete(path)}
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
              onRename={onRename}
              onDelete={onDelete}
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
  const handleRename = (path: string) => {
    console.log(`Rename ${path}`);
  };

  const handleDelete = (path: string) => {
    console.log(`Delete ${path}`);
  };

  const handleMove = (from: string, to: string) => {
    console.log(`Move ${from} to ${to}`);
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
            onRename={handleRename}
            onDelete={handleDelete}
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
  return (
    <div className="h-full">
      <FileTree
        tree={fs}
        currentFile={currentFile}
        setCurrentFile={setCurrentFile}
      />
    </div>
  );
};

export default FilesPanel;
