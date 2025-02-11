import { type Ref, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit/src/FitAddon";
import "xterm/css/xterm.css";
import { useWebContainer } from "~/web-container";
import "./xterm.css";

const terminalOpts = {
  cursorBlink: true,
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
    brightWhite: "#FFFFFF"
  }
};

const TerminalComponent = ({ ref }: { ref: Ref<{ resize: () => void }> }) => {
  const refTerm = useRef<HTMLDivElement | null>(null);

  const wc = useWebContainer();
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [fitAddon, setFitAddon] = useState<FitAddon | null>(null);

  useImperativeHandle(ref, () => ({
    resize: () => {
      fitAddon?.fit();
    }
  }), [fitAddon]);

  useEffect(() => {
    const terminal = new Terminal(terminalOpts);
    const fitAddon = new FitAddon();
    // (window as any).terminal = terminal; // debug

    let abort = false;
    const setupTerminal = () => {
      if (abort) return;
      terminal.loadAddon(fitAddon);
      terminal.open(refTerm.current!);
      fitAddon.fit();
      window.addEventListener("resize", () => fitAddon.fit());
    };

    requestAnimationFrame(() => {
      setupTerminal();
    });

    setTerminal(terminal);
    setFitAddon(fitAddon);

    return () => {
      abort = true;
      terminal.dispose();
      fitAddon.dispose();
      window.removeEventListener("resize", () => fitAddon.fit());
    };
  }, []);

  const [text, setText] = useState("");

  useEffect(() => {
    if (!terminal) return;
    const promptSymbol = "\x1b[32m$ \x1b[0m";
    const prompt = () => terminal.write(promptSymbol);

    let buffer = "";

    terminal.clear();
    prompt();

    const handleInput = async (data: string) => {
      // Handle Enter key
      console.log(data);
      if (data === "\r") {
        if (!wc) return;
        const res = await wc.spawn("sh", ["-c", buffer]);
        const output = await res.output.getReader().read();
        terminal.writeln("");
        terminal.write(output.value || "");
        buffer = "";
        prompt();
      } else if (data === "\u007F") {
        // Handle Backspace
        if (buffer.length > 0) {
          buffer = buffer.slice(0, -1);
          terminal.write("\b \b");
        }
      } else {
        // Handle regular characters
        buffer += data;
        terminal.write(data);
      }
    };
    const disposable = terminal.onData(handleInput);
    return () => {
      // const buffer = terminal.buffer.active;
      // const cursorY = buffer.cursorY;
      // const currentLine = buffer.getLine(cursorY)?.translateToString();
      // console.log(currentLine);
      terminal.write("\r\x1b[2K"); // erase current line
      disposable.dispose();
    };
  }, [wc, terminal]);

  return <>
    <div ref={refTerm} className="h-full w-full"></div>
  </>;
};

export default TerminalComponent;
