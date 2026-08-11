import type { TEditorModes } from "components/editorComponents/CodeEditor/EditorConfig";
import type { FeatureFlags } from "ee/entities/FeatureFlag";
import type { EntityTypeValue } from "ee/entities/DataTree/types";

export const APPSMITH_AI = "Ask AI";

/**
 * GraphQL editors run in `EditorModes.GRAPHQL_WITH_BINDING` ("graphql-js"), not plain "graphql".
 * Both call sites below share this so the mode that enables Ask AI can never drift from the mode
 * that builds its context.
 */
function isGraphQLMode(mode?: string) {
  return Boolean(mode?.includes("graphql"));
}

export function isAISupportedMode(mode: TEditorModes) {
  const isJavaScriptMode = mode === "javascript";
  const isQueryMode =
    mode === "sql" || isGraphQLMode(mode) || mode?.includes("sql");
  const isJSONMode = mode === "application/json" || mode?.includes("json");

  return isJavaScriptMode || isQueryMode || isJSONMode;
}

export function isAIEnabled(
  _ff: FeatureFlags,
  mode: TEditorModes,
  hasApiKey?: boolean,
) {
  if (!hasApiKey || !isAISupportedMode(mode)) {
    return false;
  }

  return true;
}

export const isAISlashCommand = (editor: CodeMirror.Editor) => {
  const cursor = editor.getCursor();
  const line = editor.getLine(cursor.line);
  const textBeforeCursor = line.substring(0, cursor.ch);

  return (
    textBeforeCursor.trim().endsWith("/ask-ai") ||
    textBeforeCursor.trim().endsWith("/ai")
  );
};

export const getAIContext = ({
  cursorPosition,
  editor,
}: {
  entityType?: EntityTypeValue;
  slashIndex?: number;
  currentLineValue?: string;
  cursorPosition: CodeMirror.Position;
  editor: CodeMirror.Editor;
}) => {
  const code = editor.getValue();
  const mode = editor.getMode().name;

  const functionName = "";
  let functionString = "";

  if (mode === "javascript") {
    const lines = code.split("\n");
    const startLine = Math.max(0, cursorPosition.line - 50);
    const endLine = Math.min(lines.length, cursorPosition.line + 50);

    functionString = lines.slice(startLine, endLine).join("\n");
  } else if (
    mode?.includes("sql") ||
    isGraphQLMode(mode) ||
    mode === "application/json" ||
    mode?.includes("json")
  ) {
    const lines = code.split("\n");
    const startLine = Math.max(0, cursorPosition.line - 40);
    const endLine = Math.min(lines.length, cursorPosition.line + 40);

    functionString = lines.slice(startLine, endLine).join("\n");
  }

  return {
    functionName,
    cursorLineNumber: cursorPosition.line,
    functionString,
    mode,
    cursorPosition,
    cursorCoordinates: editor.cursorCoords(true, "local"),
  };
};
