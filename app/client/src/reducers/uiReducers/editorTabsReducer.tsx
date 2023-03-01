import { createReducer } from "utils/ReducerUtils";
import {
  ReduxActionTypes,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { FocusEntity } from "../../navigation/FocusEntity";

const initialState: EditorTabsState = {
  openTabs: [],
};

const editorTabsReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_EDITOR_TABS]: (
    state: EditorTabsState,
    action: ReduxAction<Array<EditorTab>>,
  ) => ({
    openTabs: action.payload,
  }),
  [ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS]: () => ({
    openTabs: [],
  }),
  [ReduxActionTypes.CLOSE_EDITOR_TAB]: (
    state: EditorTabsState,
    action: ReduxAction<EditorTab>,
  ) => {
    return {
      ...state,
      openTabs: state.openTabs.filter(
        (tab) =>
          tab.id !== action.payload.id && tab.name !== action.payload.name,
      ),
    };
  },
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
