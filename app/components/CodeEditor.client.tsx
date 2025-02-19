import { useWebContainer } from "~/web-container";
import { useEffect, useRef, useState } from "react";
import * as monaco from "monaco-editor";

// const getLang = (ext: string | undefined) => {
//   if (!ext) return "plaintext";
//   return (
//     monaco.languages
//       .getLanguages()
//       .find((l) => l.extensions?.includes(`.${ext}`))?.id || "plaintext"
//   );
// };

const CodeEditorClient = ({
  file,
}: {
  file: { path: string; content: string } | null;
}) => {
  const wc = useWebContainer();
  const [editor, setEditor] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoEl = useRef<null | HTMLDivElement>(null);

  // @ts-ignore
  window.editor = editor;
  // @ts-ignore
  window.monaco = monaco;

  useEffect(() => {
    let disposable: monaco.IDisposable | null = null;

    const uri = file && monaco.Uri.file(file.path);
    const model = uri
      ? monaco.editor.getModel(uri) ||
        monaco.editor.createModel(file?.content || "", undefined, uri)
      : null;
    if (model && file) {
      if (model.getValue() !== file.content) model.setValue(file.content || "");
      disposable = model.onDidChangeContent(async (e) => {
        await wc.fs.writeFile(file.path, model.getValue());
      });
    }
    if (editor?.getModel() != model) editor?.setModel(model);

    return () => disposable?.dispose();
  }, [editor, file?.content, file?.path]);

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
