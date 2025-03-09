import * as monaco from "monaco-editor";
import { printDev } from "~/lib/dev";

let extraLibs: { content: string; filePath: string }[] = [];

const setExtraLibs = (() => {
  let to: NodeJS.Timeout | null = null;
  return () => {
    if (to) clearTimeout(to);
    to = setTimeout(() => {
      printDev("Setting extra libs");
      monaco.languages.typescript.typescriptDefaults.setExtraLibs(extraLibs);
    }, 1000);
  };
})();

const addExtraLib = (content: string, filePath: string) => {
  extraLibs = [
    ...extraLibs,
    { content, filePath: monaco.Uri.file(filePath).toString(true) },
  ];
  setExtraLibs();
};

const addOrReplaceExtraLib = (content: string, filePath: string) => {
  removeExtraLib(filePath);
  addExtraLib(content, filePath);
};

const removeExtraLib = (filePath: string) => {
  filePath = monaco.Uri.file(filePath).toString(true);
  extraLibs = extraLibs.filter(
    (lib) =>
      !(lib.filePath == filePath || lib.filePath.startsWith(`${filePath}/`)),
  );
  setExtraLibs();
};

const clearExtraLibs = () => {
  extraLibs = [];
  setExtraLibs();
};

export { addExtraLib, removeExtraLib, clearExtraLibs, addOrReplaceExtraLib };
