import MonacoEditor from "@monaco-editor/react";
import { useFs, useWebContainer } from "~/web-container";
import type { FileSystemTree } from "@webcontainer/api";

const CodeEditor = ({ currentFile }: { currentFile: string }) => {
  const fs = useFs();
  const wc = useWebContainer();

  const fileSegments = currentFile.split("/");
  const dir = fileSegments
    .slice(0, -1)
    .reduce((acc: FileSystemTree, segment) => {
      return "directory" in acc[segment] ? acc[segment].directory : acc;
    }, fs);
  const fileName = fileSegments.at(-1);
  if (!fileName) throw new Error("Invalid file name");
  const file = dir[fileName];
  if (!file || !("file" in file) || !("contents" in file.file))
    throw new Error("Invalid file");
  const content =
    file.file.contents instanceof Uint8Array
      ? new TextDecoder().decode(file.file.contents)
      : file.file.contents;

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
