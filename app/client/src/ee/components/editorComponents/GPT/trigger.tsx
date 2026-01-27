import type { TEditorModes } from "components/editorComponents/CodeEditor/EditorConfig";
import type { FeatureFlags } from "ee/entities/FeatureFlag";
import type { EntityTypeValue } from "ee/entities/DataTree/types";
import { getJSFunctionLocationFromCursor } from "pages/Editor/JSEditor/utils";

export const APPSMITH_AI = "Appsmith AI";

export function isAIEnabled(
  ff: FeatureFlags,
  mode: TEditorModes,
  hasApiKey?: boolean,
) {
  if (!hasApiKey) {
    return false;
  }

  const isJavaScriptMode = mode === "javascript";
  const isQueryMode = mode === "sql" || mode === "graphql" || mode?.includes("sql");

  return isJavaScriptMode || isQueryMode;
}

export const isAISlashCommand = (editor: CodeMirror.Editor) => {
  const cursor = editor.getCursor();
  const line = editor.getLine(cursor.line);
  const textBeforeCursor = line.substring(0, cursor.ch);
  return textBeforeCursor.trim().endsWith("/ask-ai") ||
    textBeforeCursor.trim().endsWith("/ai");
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
  
  let functionName = "";
  let functionString = "";
  
  if (mode === "javascript") {
    try {
      const location = getJSFunctionLocationFromCursor(code, cursorPosition);
      functionName = location.functionName;
      functionString = location.functionString;
    } catch (e) {
      // Error handling - removed console.error per linter
    }
  } else if (mode?.includes("sql")) {
    const lines = code.split("\n");
    const startLine = Math.max(0, cursorPosition.line - 10);
    const endLine = Math.min(lines.length, cursorPosition.line + 10);
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
