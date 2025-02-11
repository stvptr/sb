import { useState } from "react";
import MonacoEditor from "@monaco-editor/react";

const CodeEditor = () => {
  const [code, setCode] = useState<string>("console.log('Hello, world!');");

  return (
    <div className="h-full w-full border border-gray-300 rounded-md">
      <MonacoEditor
        className="h-full"
        defaultLanguage="javascript"
        value={code}
        theme="vs-dark"
        onChange={(value) => setCode(value || "")}
      />
    </div>
  );
};

export default CodeEditor;
