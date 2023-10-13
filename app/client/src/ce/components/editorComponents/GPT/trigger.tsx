/* eslint-disable @typescript-eslint/no-unused-vars */
import type { TEditorModes } from "components/editorComponents/CodeEditor/EditorConfig";
import type { FeatureFlags } from "@appsmith/entities/FeatureFlag";
import type { ENTITY_TYPE } from "@appsmith/entities/DataTree/types";

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
  entityType?: ENTITY_TYPE;
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
