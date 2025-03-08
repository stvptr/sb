import * as monaco from "monaco-editor";

let extraLibs: { content: string; filePath: string }[] = [];

const setExtraLibs = (() => {
  let to: NodeJS.Timeout | null = null;
  return (libs: { content: string; filePath?: string }[]) => {
    if (to) clearTimeout(to);
    to = setTimeout(() => {
      monaco.languages.typescript.typescriptDefaults.setExtraLibs(libs);
    }, 1000);
  };
})();

const addExtraLib = (content: string, filePath: string) => {
  extraLibs = [
    ...extraLibs,
    { content, filePath: monaco.Uri.file(filePath).toString(true) },
  ];
  setExtraLibs(extraLibs);
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
  setExtraLibs(extraLibs);
};

const clearExtraLibs = () => {
  setExtraLibs([]);
};

export { addExtraLib, removeExtraLib, clearExtraLibs, addOrReplaceExtraLib };
