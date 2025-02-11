import CodeEditor from "./CodeEditor.client";
import Terminal from "./Terminal.client";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
  getWebContainerP,
  WebContainerContext,
} from "~/wc/web-container.client";
import { Await } from "react-router";
import { ClientOnly } from "~/components/ClientOnly";
import Preview from "~/components/Preview";
import FilesPanel from "~/components/FilesPanel";
import { Settings } from "lucide-react";
import type { Resizable } from "~/types/types";

const CodeView = () => {
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);

  const terminalRef = useRef<null | Resizable>(null);
  const editorRef = useRef<null | Resizable>(null);

  const onResize = useCallback(() => {
    terminalRef.current?.resize();
    editorRef.current?.resize();
  }, []);

  useEffect(() => {
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  },[onResize]);

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={20}>
        <FilesPanel
          currentFile={currentFilePath}
          setCurrentFile={setCurrentFilePath}
        />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={60}>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={80}>
            <div className="h-full w-full p-4">
              <CodeEditor filePath={currentFilePath} ref={editorRef} />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={20} onResize={onResize}>
            <div className="h-full w-full p-4">
              <Terminal ref={terminalRef} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={20} onResize={onResize}>
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
          <Await resolve={getWebContainerP().get()}>
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
