import CodeMirror from "codemirror";
import type { TEditorModes } from "components/editorComponents/CodeEditor/EditorConfig";
import { EditorModes } from "components/editorComponents/CodeEditor/EditorConfig";
import "codemirror/addon/mode/multiplex";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/sql/sql";
import "codemirror/addon/hint/sql-hint";
import type { TEditorSqlModes } from "./sql/config";
import { sqlModesConfig } from "./sql/config";

export const BINDING_OPEN = "{{",
  BINDING_CLOSE = "}}";

export interface MultiplexingModeConfig {
  outerMode: string | { name: string; json?: boolean };
  innerModes: {
    open: string;
    close: string;
  }[];
}

export type MultiplexingModeConfigs = Record<
  TEditorModes,
  MultiplexingModeConfig | undefined
>;

export const MULTIPLEXING_MODE_CONFIGS: MultiplexingModeConfigs = {
  [EditorModes.TEXT_WITH_BINDING]: {
    outerMode: EditorModes.TEXT,
    innerModes: [
      {
        open: BINDING_OPEN,
        close: BINDING_CLOSE,
      },
    ],
  },
  [EditorModes.JSON_WITH_BINDING]: {
    outerMode: { name: "javascript", json: true },
    innerModes: [
      {
        open: BINDING_OPEN,
        close: BINDING_CLOSE,
      },
    ],
  },
  [EditorModes.GRAPHQL_WITH_BINDING]: {
    outerMode: EditorModes.GRAPHQL,
    innerModes: [
      {
        open: BINDING_OPEN,
        close: BINDING_CLOSE,
      },
      {
        // https://github.com/appsmithorg/appsmith/issues/16702
        open: '"{{',
        close: '}}"',
      },
    ],
  },
  ...Object.values(sqlModesConfig)
    .filter((config) => config.isMultiplex)
    .reduce(
      (prev, current) => {
        prev[current.mode] = {
          outerMode: current.mime,
          innerModes: [
            {
              open: BINDING_OPEN,
              close: BINDING_CLOSE,
            },
          ],
        };

        return prev;
      },
      {} as Record<TEditorSqlModes, MultiplexingModeConfig | undefined>,
    ),
  "text/plain": undefined,
  "application/json": undefined,
  javascript: undefined,
  graphql: undefined,
  css: undefined,
  htmlmixed: undefined,
};

Object.keys(MULTIPLEXING_MODE_CONFIGS).forEach((key) => {
  const multiplexConfig = MULTIPLEXING_MODE_CONFIGS[key as TEditorModes];

  if (!multiplexConfig) return;

  CodeMirror.defineMode(key, function (config) {
    // @ts-expect-error: Types are not available
    return CodeMirror.multiplexingMode(
      CodeMirror.getMode(config, multiplexConfig.outerMode),
      ...multiplexConfig.innerModes.map((innerMode) => ({
        open: innerMode.open,
        close: innerMode.close,
        delimStyle: "binding-brackets",
        mode: CodeMirror.getMode(config, {
          name: "javascript",
          json: true,
        }),
      })),
    );
  });
});
