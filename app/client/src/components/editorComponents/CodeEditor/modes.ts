import CodeMirror from "codemirror";
import { EditorModes } from "components/editorComponents/CodeEditor/EditorConfig";

CodeMirror.defineMode(EditorModes.TEXT_WITH_BINDING, function(config) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  return CodeMirror.multiplexingMode(
    CodeMirror.getMode(config, EditorModes.TEXT),
    {
      open: "{{",
      close: "}}",
      mode: CodeMirror.getMode(config, {
        name: "javascript",
      }),
    },
  );
});

CodeMirror.defineMode(EditorModes.JSON_WITH_BINDING, function(config) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  return CodeMirror.multiplexingMode(
    CodeMirror.getMode(config, EditorModes.JSON),
    {
      open: "{{",
      close: "}}",
      mode: CodeMirror.getMode(config, {
        name: "javascript",
      }),
    },
  );
});

CodeMirror.defineMode(EditorModes.SQL_WITH_BINDING, function(config) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  return CodeMirror.multiplexingMode(
    CodeMirror.getMode(config, EditorModes.SQL),
    {
      open: "{{",
      close: "}}",
      mode: CodeMirror.getMode(config, {
        name: "javascript",
      }),
    },
  );
});
