import CodeEditorClient from "./CodeEditor.client";
import Terminal from "./Terminal.client";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { Suspense, useRef, useState } from "react";
import { getWebContainerP, useFs, WebContainerContext } from "~/web-container";
import { Await } from "react-router";
import { ClientOnly } from "~/components/ClientOnly";
import Preview from "~/components/Preview";
import FilesPanel from "~/components/FilesPanel";
import { Settings } from "lucide-react";
import type { FileSystemTree } from "@webcontainer/api";

const getFileContents = (fs: FileSystemTree, path: string | null) => {
  if (!path) return null;
  const fileSegments = path.split("/");
  const dir = fileSegments
    .slice(0, -1)
    .reduce((acc: FileSystemTree | null, segment) => {
      const s = acc?.[segment];
      if (!s) return null;
      return "directory" in s ? s.directory : acc;
    }, fs);
  if (!dir) return null;
  const fileName = fileSegments.at(-1);
  if (!fileName) return null;
  const file = dir[fileName];
  if (!file || !("file" in file) || !("contents" in file.file)) return null;
  return file.file.contents instanceof Uint8Array
    ? new TextDecoder().decode(file.file.contents)
    : file.file.contents;
};

const CodeView = () => {
  const ref = useRef<{ resize: () => void } | null>(null);
  const [currentFile, setCurrentFile] = useState<string | null>(null);

  const fs = useFs();
  const fileContent = getFileContents(fs, currentFile);
  if (currentFile && fileContent == null) setCurrentFile(fileContent);

  const file =
    currentFile && fileContent !== null
      ? { path: currentFile, content: fileContent }
      : null;

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
              <CodeEditorClient file={file} />
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
