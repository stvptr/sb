import MonacoEditor from "@monaco-editor/react";
import { useFs, useWebContainer } from "~/web-container";
import type { FileSystemTree } from "@webcontainer/api";

const getFileContents = (fs: FileSystemTree, path: string) => {
  const fileSegments = path.split("/");
  const dir = fileSegments
    .slice(0, -1)
    .reduce((acc: FileSystemTree, segment) => {
      return "directory" in acc[segment] ? acc[segment].directory : acc;
    }, fs);
  const fileName = fileSegments.at(-1);
  if (!fileName) return null;
  const file = dir[fileName];
  if (!file || !("file" in file) || !("contents" in file.file)) return null;
  return file.file.contents instanceof Uint8Array
    ? new TextDecoder().decode(file.file.contents)
    : file.file.contents;
};

const CodeEditor = ({ currentFile }: { currentFile: string }) => {
  const fs = useFs();
  const wc = useWebContainer();
  const content = getFileContents(fs, currentFile);

  if (content === null) {
    return <div>No file open</div>;
  }

  return (
    <div className="h-full w-full rounded-md border border-gray-300">
      <MonacoEditor
        className="h-full"
        defaultLanguage="javascript"
        value={content}
        theme="vs-dark"
        onChange={(value) => wc.fs.writeFile(currentFile, value || "")}
      />
    </div>
  );
};

export default CodeEditor;
