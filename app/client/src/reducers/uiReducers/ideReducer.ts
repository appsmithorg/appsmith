import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { EditorViewMode } from "@appsmith/entities/IDE/constants";

const initialState: IDEState = {
  view: EditorViewMode.FullScreen,
  pagesActive: false,
};

const ideReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_IDE_EDITOR_VIEW_MODE]: (
    state: IDEState,
    action: ReduxAction<{ view: EditorViewMode }>,
  ) => ({ ...state, view: action.payload.view }),
  [ReduxActionTypes.SET_IDE_EDITOR_PAGES_ACTIVE_STATUS]: (
    state: IDEState,
    action: ReduxAction<{ pagesActive: boolean }>,
  ) => ({ ...state, pagesActive: action.payload.pagesActive }),
});

export interface IDEState {
  view: EditorViewMode;
  pagesActive: boolean;
}

export default ideReducer;
