import CodeEditor from "./CodeEditor";
import { ClientOnly } from "~/components/ClientOnly";
import Terminal from "./Terminal.client";

const CodeView = () => {
  return (
    <div className="flex flex-col h-screen p-4 gap-4">
      <div className="flex-grow">
        <ClientOnly fallback={<div>Loading editor...</div>}>
          {() => <CodeEditor />}
        </ClientOnly>
      </div>
      <div>
        <ClientOnly fallback={<div>Loading terminal...</div>}>
          {() => <Terminal />}
        </ClientOnly>
      </div>
    </div>
  );
};

export default CodeView;
