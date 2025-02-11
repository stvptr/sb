import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit/src/FitAddon";
import "xterm/css/xterm.css";

const TerminalComponent = () => {
  const terminalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const terminal = new Terminal({ cursorBlink: true });
    const fitAddon = new FitAddon();

    const promptSymbol = "\x1b[32m$ \x1b[0m";
    const prompt = () => terminal.write(promptSymbol);

    let buffer = "";

    const resizer = () => fitAddon.fit();
    const handleInput = (data: string) => {
      // Handle Enter key
      if (data === "\r") {
        terminal.writeln(`\r\nYou entered: ${buffer}`);
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
    let abort = false;

    const setupTerminal = () => {
      if (!terminalRef.current) return;
      if (abort) return;

      terminal.loadAddon(fitAddon);
      terminal.open(terminalRef.current);

      fitAddon.fit();
      window.addEventListener("resize", resizer);

      terminal.writeln("Welcome to the terminal!");
      terminal.writeln("Type some commands...");
      prompt();

      terminal.onData(handleInput);
    };

    requestAnimationFrame(() => {
      setupTerminal();
    });

    return () => {
      abort = true;
      terminal.dispose();
      window.removeEventListener("resize", resizer);
    };
  }, []);

  return <div ref={terminalRef} style={{ height: 200 }}></div>;
};

export default TerminalComponent;
