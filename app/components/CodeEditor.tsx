import MonacoEditor, { useMonaco } from "@monaco-editor/react";
import { useFs, useWebContainer } from "~/web-container";
import type { FileSystemTree } from "@webcontainer/api";
import { useCallback, useEffect } from "react";

const getFileContents = (fs: FileSystemTree, path: string | null) => {
  if (!path) return null;
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

const CodeEditor = ({ currentFile }: { currentFile: string | null }) => {
  const fs = useFs();
  const wc = useWebContainer();
  const content = getFileContents(fs, currentFile);

  const monaco = useMonaco();

  useEffect(() => {
    if (monaco) {
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        jsx: monaco.languages.typescript.JsxEmit.React, // Enable TSX
        target: monaco.languages.typescript.ScriptTarget.ESNext,
        allowNonTsExtensions: true,
        moduleResolution:
          monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.ESNext,
      });
    }
  }, [monaco]);
  const getLang = useCallback(
    (ext: string | undefined) => {
      if (!ext) return "plaintext";
      return (
        monaco?.languages
          .getLanguages()
          .find((l) => l.extensions?.includes(ext))?.id || "plaintext"
      );
    },
    [monaco],
  );

  if (content === null) {
    return <div>No file open</div>;
  }

  return (
    <div className="h-full w-full rounded-md border border-gray-300">
      <MonacoEditor
        className="h-full"
        language={getLang(currentFile?.split(".").at(-1))}
        value={content}
        theme="vs-dark"
        onChange={(value) =>
          currentFile && wc.fs.writeFile(currentFile, value || "")
        }
      />
    </div>
  );
};

export default CodeEditor;
