/* eslint-disable @typescript-eslint/no-unused-vars */
import type { TEditorModes } from "components/editorComponents/CodeEditor/EditorConfig";
import type { FeatureFlags } from "ee/entities/FeatureFlag";
import type { EntityTypeValue } from "ee/entities/DataTree/types";

export const APPSMITH_AI = "Appsmith AI";

export function isAIEnabled(ff: FeatureFlags, mode: TEditorModes) {
  return false;
}

export const isAISlashCommand = (editor: CodeMirror.Editor) => {
  return false;
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
  return {
    functionName: "",
    cursorLineNumber: cursorPosition.line,
    functionString: "",
    mode: editor.getMode().name,
    cursorPosition,
    cursorCoordinates: editor.cursorCoords(true, "local"),
  };
};
