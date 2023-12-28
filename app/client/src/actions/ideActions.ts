import type { EditorViewMode } from "entities/IDE/constants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const setIdeEditorViewMode = (mode: EditorViewMode) => {
  return {
    type: ReduxActionTypes.SET_IDE_EDITOR_VIEW_MODE,
    payload: {
      view: mode,
    },
  };
};
