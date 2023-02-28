import { createReducer } from "utils/ReducerUtils";
import {
  ReduxActionTypes,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { ErrorReduxState } from "./errorReducer";
import { FocusEntity } from "../../navigation/FocusEntity";

const initialState: EditorTabsState = {
  openTabs: [],
};

const editorTabsReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_EDITOR_TABS]: (
    state: ErrorReduxState,
    action: ReduxAction<Array<unknown>>,
  ) => ({
    openTabs: action.payload,
  }),
  [ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS]: () => ({
    openTabs: [],
  }),
});

export type EditorTab = {
  name: string;
  id: string;
  entityType: FocusEntity;
  subType?: string;
};

export interface EditorTabsState {
  openTabs: Array<EditorTab>;
}

export default editorTabsReducer;
