import {
  type Ref,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as monaco from "monaco-editor";
import type { Resizable } from "~/types/types";
import { useWebContainer } from "~/wc/web-container.client";

const CodeEditor = ({
  filePath,
  ref,
}: {
  filePath: string | null;
  ref: Ref<Resizable | null>;
}) => {
  const [editor, setEditor] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoEl = useRef<null | HTMLDivElement>(null);
  const wc = useWebContainer();

  useImperativeHandle(
    ref,
    () => ({
      resize: () => {
        editor?.layout();
      },
    }),
    [editor],
  );

  useEffect(() => {
    if (!editor) return;

    const model = filePath
      ? monaco.editor.getModel(monaco.Uri.file(filePath))
      : null;

    if (editor.getModel() !== model) {
      editor.setModel(model);
      if (model && filePath) {
        const disposable = model.onDidChangeContent(() => {
          // save file
          wc.fs.writeFile(filePath, model.getValue());
        });
        return () => disposable.dispose();
      }
    }
  }, [editor, filePath, wc]);

  useEffect(() => {
    const editor = monaco.editor.create(monacoEl.current!, {});
    setEditor(editor);

    return () => editor?.dispose();
  }, []);

  return (
    <div className="w-fullborder-gray-300 h-full">
      <div className="h-full w-full" ref={monacoEl}></div>
    </div>
  );
};

export default CodeEditor;
