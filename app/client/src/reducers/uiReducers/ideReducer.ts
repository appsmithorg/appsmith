import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { EditorViewMode } from "@appsmith/entities/IDE/constants";

const initialState: IDEState = {
  view: EditorViewMode.FullScreen,
};

const ideReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_IDE_EDITOR_VIEW_MODE]: (
    state: IDEState,
    action: ReduxAction<{ view: EditorViewMode }>,
  ) => ({ ...state, view: action.payload.view }),
});

export interface IDEState {
  view: EditorViewMode;
}

export default ideReducer;
