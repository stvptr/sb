import * as monaco from "monaco-editor";

export const removeModels = (filename: string) => {
  monaco.editor
    .getModels()
    .filter((model) => {
      return (
        model.uri.path === `/${filename}` ||
        model.uri.path.startsWith(`/${filename}/`)
      );
    })
    .forEach((model) => model.dispose());
};

export const createModel = (filename: string, content: string) => {
  monaco.editor.createModel(content, undefined, monaco.Uri.file(filename));
};

export const createOrUpdateModel = (filename: string, content: string) => {
  const model = monaco.editor.createModel(
    content,
    undefined,
    monaco.Uri.file(filename),
  );
  if (model) {
    model.setValue(content);
  } else {
    createModel(filename, content);
  }
};

export const modelExists = (filename: string) => {
  return !!monaco.editor.getModel(monaco.Uri.file(filename));
};

export const updateModel = (filename: string, content: string) => {
  const model = monaco.editor.getModel(monaco.Uri.file(filename));
  if (!model) throw new Error("No model found.");
  if(model.getValue() !== content) model.setValue(content);
};

export const clearModels = () => {
  monaco.editor.getModels().forEach((model) => model.dispose());
};
