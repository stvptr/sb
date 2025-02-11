import CodeEditor from "./CodeEditor";
import { ClientOnly } from "~/components/ClientOnly";
import Terminal from "./Terminal.client";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "~/components/ui/resizable";
import { useRef } from "react";


const CodeView = () => {
  const ref = useRef<{ resize: () => void } | null>(null);
  return (
    <ResizablePanelGroup
      direction="horizontal"
    >
      <ResizablePanel defaultSize={20}>
        FILES
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={60}>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={80}>
            <div className="p-4 h-full">
              <ClientOnly fallback={<div>Loading editor...</div>}>
                {() => <CodeEditor />}
              </ClientOnly>
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={20} onResize={() => ref.current?.resize()}>
            <div className="p-4 h-full w-full">
              <ClientOnly fallback={<div>Loading terminal...</div>}>
                {() => <Terminal ref={ref} />}
              </ClientOnly>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={20}>
        PREVIEW
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default CodeView;
