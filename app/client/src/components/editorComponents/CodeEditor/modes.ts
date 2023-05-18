import CodeMirror from "codemirror";
import { EditorModes } from "components/editorComponents/CodeEditor/EditorConfig";
import "codemirror/addon/mode/multiplex";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/sql/sql";
import "codemirror/addon/hint/sql-hint";
import { sqlModesConfig } from "./sql/config";

CodeMirror.defineMode(EditorModes.TEXT_WITH_BINDING, function (config) {
  // @ts-expect-error: Types are not available
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

CodeMirror.defineMode(EditorModes.JSON_WITH_BINDING, function (config) {
  // @ts-expect-error: Types are not available
  return CodeMirror.multiplexingMode(
    CodeMirror.getMode(config, { name: "javascript", json: true }),
    {
      open: "{{",
      close: "}}",
      mode: CodeMirror.getMode(config, {
        name: "javascript",
      }),
    },
  );
});

CodeMirror.defineMode(EditorModes.GRAPHQL_WITH_BINDING, function (config) {
  // @ts-expect-error: Types are not available
  return CodeMirror.multiplexingMode(
    CodeMirror.getMode(config, EditorModes.GRAPHQL),
    {
      open: "{{",
      close: "}}",
      mode: CodeMirror.getMode(config, {
        name: "javascript",
      }),
    },
    {
      open: '"{{',
      close: '}}"',
      mode: CodeMirror.getMode(config, {
        name: "javascript",
      }),
    },
  );
});

for (const sqlModeConfig of Object.values(sqlModesConfig)) {
  if (!sqlModeConfig.isMultiplex) continue;
  CodeMirror.defineMode(sqlModeConfig.mode, function (config) {
    // @ts-expect-error: Types are not available
    return CodeMirror.multiplexingMode(
      CodeMirror.getMode(config, sqlModeConfig.mime),
      {
        open: "{{",
        close: "}}",
        mode: CodeMirror.getMode(config, {
          name: "javascript",
        }),
      },
    );
  });
}
