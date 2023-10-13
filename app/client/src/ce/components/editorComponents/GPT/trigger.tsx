/* eslint-disable @typescript-eslint/no-unused-vars */
import type { TEditorModes } from "components/editorComponents/CodeEditor/EditorConfig";
export const APPSMITH_AI = "Appsmith AI";
import type { FeatureFlags } from "@appsmith/entities/FeatureFlag";
import {
  ENTITY_TYPE_VALUE,
  type ENTITY_TYPE,
} from "@appsmith/entities/DataTree/types";

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
