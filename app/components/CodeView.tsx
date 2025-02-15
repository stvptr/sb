import CodeEditor from "./CodeEditor";
import Terminal from "./Terminal.client";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "~/components/ui/resizable";
import { Suspense, useRef } from "react";
import { getWebContainerP, WebContainerContext } from "~/web-container";
import { Await } from "react-router";
import { ClientOnly } from "~/components/ClientOnly";

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
            <div className="p-4 h-full w-full">
              <CodeEditor currentFile="script.js" />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={20} onResize={() => ref.current?.resize()}>
            <div className="p-4 h-full w-full">
              <Terminal ref={ref} />
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

const CodeViewWc = () => {
  return <ClientOnly>
    {() => <Suspense fallback={<div>loading web container</div>}>
      <Await resolve={getWebContainerP()}>
        {(wc) => <WebContainerContext value={wc}><CodeView /></WebContainerContext>}
      </Await>
    </Suspense>}
  </ClientOnly>;
};

export default CodeViewWc;
