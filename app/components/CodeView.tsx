import CodeEditor from "./CodeEditor";
import Terminal from "./Terminal.client";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { Suspense, useRef } from "react";
import { getWebContainerP, WebContainerContext } from "~/web-container";
import { Await } from "react-router";
import { ClientOnly } from "~/components/ClientOnly";
import Preview from "~/components/Preview";

const CodeView = () => {
  const ref = useRef<{ resize: () => void } | null>(null);
  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={20}>FILES</ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={60}>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={80}>
            <div className="h-full w-full p-4">
              <CodeEditor currentFile="script.js" />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel
            defaultSize={20}
            onResize={() => ref.current?.resize()}
          >
            <div className="h-full w-full p-4">
              <Terminal ref={ref} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={20}><Preview/></ResizablePanel>
    </ResizablePanelGroup>
  );
};

const CodeViewWc = () => {
  return (
    <ClientOnly>
      {() => (
        <Suspense fallback={<div>loading web container</div>}>
          <Await resolve={getWebContainerP()}>
            {(wc) => (
              <WebContainerContext value={wc}>
                <CodeView />
              </WebContainerContext>
            )}
          </Await>
        </Suspense>
      )}
    </ClientOnly>
  );
};

export default CodeViewWc;
