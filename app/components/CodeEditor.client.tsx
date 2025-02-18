import { useFs, useWebContainer } from "~/web-container";
import type { FileSystemTree } from "@webcontainer/api";
import { useEffect, useRef, useState } from "react";
import * as monaco from "monaco-editor";

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

// const getLang = (ext: string | undefined) => {
//   if (!ext) return "plaintext";
//   return (
//     monaco.languages
//       .getLanguages()
//       .find((l) => l.extensions?.includes(`.${ext}`))?.id || "plaintext"
//   );
// };

const CodeEditorClient = ({ currentFile }: { currentFile: string | null }) => {
  const fs = useFs();
  const wc = useWebContainer();
  const content = getFileContents(fs, currentFile);
  const [editor, setEditor] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoEl = useRef<null | HTMLDivElement>(null);

  // @ts-ignore
  window.editor = editor;
  // @ts-ignore
  window.monaco = monaco;

  useEffect(() => {
    let disposable: monaco.IDisposable | null = null;

    const uri = currentFile && monaco.Uri.file(currentFile);
    const model = uri
      ? monaco.editor.getModel(uri) ||
        monaco.editor.createModel(content || "", undefined, uri)
      : null;
    if (model && currentFile) {
      if (model.getValue() !== content) model.setValue(content || "");
      disposable = model.onDidChangeContent(async (e) => {
        await wc.fs.writeFile(currentFile, model.getValue());
      });
    }
    if (editor?.getModel() != model) editor?.setModel(model);

    return () => disposable?.dispose();
  }, [editor, currentFile, content]);

  useEffect(() => {
    const editor = monaco.editor.create(monacoEl.current!, {});
    setEditor(editor);
    return () => editor?.dispose();
  }, []);

  // if (content === null) {
  //   return <div>No file open</div>;
  // }

  return (
    <div className="w-fullborder-gray-300 h-full">
      <div className="h-full w-full" ref={monacoEl}></div>
    </div>
  );
};

export default CodeEditorClient;
