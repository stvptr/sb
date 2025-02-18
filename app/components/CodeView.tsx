import CodeEditorClient from "./CodeEditor.client";
import Terminal from "./Terminal.client";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { Suspense, useEffect, useRef, useState } from "react";
import {
  getWebContainerP,
  useWebContainer,
  WebContainerContext,
} from "~/web-container";
import { Await } from "react-router";
import { ClientOnly } from "~/components/ClientOnly";
import Preview from "~/components/Preview";
import FilesPanel from "~/components/FilesPanel";
import { Settings } from "lucide-react";

const CodeView = () => {
  const ref = useRef<{ resize: () => void } | null>(null);
  const [currentFile, setCurrentFile] = useState<string | null>(null);

  const wc = useWebContainer();

  useEffect(() => {
    if (!currentFile) return;

    const watcher = wc.fs.watch(currentFile, (event) => {
      if (event === "rename") {
        setCurrentFile(null);
      }
    });
    return () => watcher.close();
  }, [currentFile]);

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={20}>
        <FilesPanel currentFile={currentFile} setCurrentFile={setCurrentFile} />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={60}>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={80}>
            <div className="h-full w-full p-4">
              <CodeEditorClient currentFile={currentFile} />
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
      <ResizablePanel defaultSize={20}>
        <Preview />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

const fb = (
  <div className="h-full">
    <div className="flex h-full items-center justify-center gap-4">
      <Settings className="h-8 w-8 animate-spin duration-[3s]" />
      <span>Setting up your environment</span>
    </div>
  </div>
);

const CodeViewWc = () => {
  return (
    <ClientOnly>
      {() => (
        <Suspense fallback={fb}>
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
