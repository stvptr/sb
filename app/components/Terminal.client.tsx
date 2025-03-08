import {
  createRef,
  type Ref,
  type RefObject,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit/src/FitAddon";
import { useWebContainer } from "~/wc/web-container.client";
import "./xterm.css";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";
import { Plus, X } from "lucide-react";
import type { Resizable } from "~/types/types";

const TerminalComponent = ({ ref }: { ref: Ref<Resizable | null> }) => {
  const refTerm = useRef<HTMLDivElement | null>(null);

  const wc = useWebContainer();
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [fitAddon, setFitAddon] = useState<FitAddon | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      resize: () => {
        fitAddon?.fit();
        requestAnimationFrame(() => fitAddon?.fit());
      },
    }),
    [fitAddon],
  );

  useEffect(() => {
    const terminal = new Terminal(terminalOpts);
    const fitAddon = new FitAddon();

    let abort = false;
    const setupTerminal = () => {
      if (abort) return;
      terminal.loadAddon(fitAddon);
      terminal.open(refTerm.current!);
      fitAddon.fit();
    };

    requestAnimationFrame(() => {
      setupTerminal();
    });

    // since the effect cleans up the terminal and because of react strict mode, need to be in a state instead of being set once for the lifetime of the component
    setTerminal(terminal);
    setFitAddon(fitAddon);

    return () => {
      abort = true;
      terminal.dispose();
      fitAddon.dispose();
    };
  }, []);

  useEffect(() => {
    if (!terminal) return;
    const fn = async () => {
      const process = await wc.spawn("jsh");
      process.output.pipeTo(
        new WritableStream({
          write(data) {
            terminal.write(data);
          },
        }),
      );
      const input = process.input.getWriter();
      const onDataDisposable = terminal.onData((data) => input.write(data));
      return { process, onDataDisposable };
    };
    const setup = fn();

    return () => {
      setup.then((args) => {
        args.onDataDisposable.dispose();
        args.process.kill();
      });
    };
  }, [wc, terminal]);

  return (
    <>
      <div ref={refTerm} className="h-full w-full"></div>
    </>
  );
};

const ruid = crypto.randomUUID();
const TerminalTabs = ({ ref }: { ref: Ref<{ resize: () => void } | null> }) => {
  const [terminals, setTerminals] = useState<
    { id: string; ref: RefObject<Resizable | null> }[]
  >([{ id: ruid, ref: createRef() }]);
  const [activeTab, setActiveTab] = useState<string | null>(ruid);

  useImperativeHandle(
    ref,
    () => ({
      resize: () => terminals.forEach((t) => t.ref?.current?.resize()),
    }),
    [terminals],
  );

  const addTerminal = () => {
    const id = crypto.randomUUID();
    setTerminals((prev) => [...prev, { id, ref: createRef() }]);
    setActiveTab(id);
  };

  const removeTerminal = (id: string) => {
    setTerminals((prev) => prev.filter((t) => t.id !== id));
    if (activeTab === id) {
      setActiveTab(terminals.find((t) => t.id !== id)?.id || null);
    }
  };

  return (
    <div className="flex h-full w-full flex-col">
      <Tabs
        value={activeTab || ""}
        onValueChange={(e) => {
          setActiveTab(e);
          terminals.find((t) => t.id === e)?.ref?.current?.resize();
        }}
        className="flex h-full w-full flex-col"
      >
        <div className="flex justify-between">
          <div className="overflow-x-auto">
            <TabsList>
              {terminals.map(({ id }, index) => (
                <TabsTrigger
                  key={id}
                  value={id}
                  className="flex items-center space-x-2"
                >
                  <span>Terminal {index + 1}</span>
                  <X
                    className="h-4 w-4 cursor-pointer"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      removeTerminal(id);
                    }}
                  />
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <Button size="icon" className="ml-4 shrink-0" onClick={addTerminal}>
            <Plus />
          </Button>
        </div>
        {terminals.map(({ id, ref }) => (
          <TabsContent
            key={id}
            value={id}
            className="h-full overflow-hidden"
            forceMount
            hidden={id !== activeTab}
          >
            <TerminalComponent ref={ref} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default TerminalTabs;

const terminalOpts: ConstructorParameters<typeof Terminal>[0] = {
  cursorBlink: true,
  convertEol: true,
  fontSize: 14,
  fontFamily: "Fira Code, monospace",
  theme: {
    background: "#1E1E1E",
    foreground: "#D4D4D4",
    cursor: "#FFFFFF",
    black: "#000000",
    red: "#FF5F56",
    green: "#27D796",
    yellow: "#FFBD2E",
    blue: "#007AFF",
    magenta: "#C678DD",
    cyan: "#56B6C2",
    white: "#EDEDED",
    brightBlack: "#7F7F7F",
    brightRed: "#FF6E67",
    brightGreen: "#5AF78E",
    brightYellow: "#F3F99D",
    brightBlue: "#57C7FF",
    brightMagenta: "#FF9CEE",
    brightCyan: "#9AEDFE",
    brightWhite: "#FFFFFF",
  },
};
