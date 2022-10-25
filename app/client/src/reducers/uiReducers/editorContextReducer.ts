import { createImmerReducer } from "utils/ReducerUtils";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export type EvaluatedPopupState = {
  type: boolean;
  example: boolean;
  value: boolean;
};

export type CodeEditorContext = {
  evalPopupState?: EvaluatedPopupState;
};

export type CodeEditorHistory = Record<string, CodeEditorContext>;

export type EditorContextState = {
  focusableField?: string;
  codeEditorHistory: Record<string, CodeEditorContext>;
  propertySectionState: Record<string, boolean>;
  selectedPropertyTabIndex: number;
  selectedDebuggerTab: string;
};

const initialState: EditorContextState = {
  codeEditorHistory: {},
  propertySectionState: {},
  selectedPropertyTabIndex: 0,
  selectedDebuggerTab: "",
};

/**
 * Context Reducer to store states of different components of editor
 */
export const editorContextReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_FOCUSABLE_PROPERTY_FIELD]: (
    state: EditorContextState,
    action: {
      payload: { path: string };
    },
  ) => {
    const { path } = action.payload;
    state.focusableField = path;
  },
  [ReduxActionTypes.SET_CODE_EDITOR_FOCUS]: (
    state: EditorContextState,
    action: {
      payload: { key: string };
    },
  ) => {
    const { key } = action.payload;
    if (!key) return;
    state.focusableField = key;
  },
  [ReduxActionTypes.SET_EVAL_POPUP_STATE]: (
    state: EditorContextState,
    action: { payload: { key: string; evalPopupState: EvaluatedPopupState } },
  ) => {
    const { evalPopupState, key } = action.payload;
    if (!key) return;
    if (!state.codeEditorHistory[key]) state.codeEditorHistory[key] = {};
    state.codeEditorHistory[key].evalPopupState = evalPopupState;
  },
  [ReduxActionTypes.SET_PROPERTY_SECTION_STATE]: (
    state: EditorContextState,
    action: { payload: { key: string; isOpen: boolean } },
  ) => {
    const { isOpen, key } = action.payload;
    if (!key) return;
    state.propertySectionState[key] = isOpen;
  },
  [ReduxActionTypes.SET_ALL_PROPERTY_SECTION_STATE]: (
    state: EditorContextState,
    action: { payload: { [key: string]: boolean } },
  ) => {
    state.propertySectionState = action.payload;
  },
  [ReduxActionTypes.SET_SELECTED_PROPERTY_TAB_INDEX]: (
    state: EditorContextState,
    action: { payload: number },
  ) => {
    state.selectedPropertyTabIndex = action.payload;
  },
  [ReduxActionTypes.SET_CANVAS_DEBUGGER_SELECTED_TAB]: (
    state: EditorContextState,
    action: { payload: string },
  ) => {
    state.selectedDebuggerTab = action.payload;
  },
});
