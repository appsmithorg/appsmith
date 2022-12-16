import { createImmerReducer } from "utils/ReducerUtils";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export type CursorPosition = {
  line: number;
  ch: number;
};

export type EvaluatedPopupState = {
  type: boolean;
  example: boolean;
  value: boolean;
};

export type CodeEditorContext = {
  cursorPosition?: CursorPosition;
  evalPopupState?: EvaluatedPopupState;
};

export type PropertyPanelContext = {
  propertySectionState: Record<string, boolean>;
  selectedPropertyTabIndex: number;
};

export type PropertyPanelState = {
  [key: string]: PropertyPanelContext;
};

export type CodeEditorHistory = Record<string, CodeEditorContext>;

export type EditorContextState = {
  entityCollapsibleFields: Record<string, boolean>;
  subEntityCollapsibleFields: Record<string, boolean>;
  explorerSwitchIndex: number;
  focusedInputField?: string;
  codeEditorHistory: Record<string, CodeEditorContext>;
  propertySectionState: Record<string, boolean>;
  selectedPropertyTabIndex: number;
  selectedDebuggerTab: string;
  propertyPanelState: PropertyPanelState;
};

const initialState: EditorContextState = {
  codeEditorHistory: {},
  propertySectionState: {},
  selectedPropertyTabIndex: 0,
  selectedDebuggerTab: "",
  propertyPanelState: {},
  entityCollapsibleFields: {},
  subEntityCollapsibleFields: {},
  explorerSwitchIndex: 0,
};

const entitySections = ["Pages", "Widgets", "Queries/JS", "Datasources"];

export const isSubEntities = (name: string): boolean => {
  return entitySections.indexOf(name) < 0;
};

/**
 * Context Reducer to store states of different components of editor
 */
export const editorContextReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_FOCUSABLE_INPUT_FIELD]: (
    state: EditorContextState,
    action: {
      payload: { path: string };
    },
  ) => {
    const { path } = action.payload;
    state.focusedInputField = path;
  },
  [ReduxActionTypes.SET_CODE_EDITOR_CURSOR]: (
    state: EditorContextState,
    action: {
      payload: { path: string; cursorPosition: CursorPosition };
    },
  ) => {
    const { cursorPosition, path } = action.payload;
    if (!path) return;
    if (!state.codeEditorHistory[path]) state.codeEditorHistory[path] = {};
    state.codeEditorHistory[path].cursorPosition = cursorPosition;
  },
  [ReduxActionTypes.SET_CODE_EDITOR_CURSOR_HISTORY]: (
    state: EditorContextState,
    action: {
      payload: Record<string, CodeEditorContext>;
    },
  ) => {
    state.codeEditorHistory = action.payload || {};
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
  [ReduxActionTypes.SET_WIDGET_PROPERTY_SECTION_STATE]: (
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
  [ReduxActionTypes.SET_WIDGET_SELECTED_PROPERTY_TAB_INDEX]: (
    state: EditorContextState,
    action: { payload: { index: number } },
  ) => {
    if (action.payload?.index !== undefined)
      state.selectedPropertyTabIndex = action.payload.index;
  },
  [ReduxActionTypes.SET_CANVAS_DEBUGGER_SELECTED_TAB]: (
    state: EditorContextState,
    action: { payload: string },
  ) => {
    state.selectedDebuggerTab = action.payload;
  },
  [ReduxActionTypes.SET_PANEL_SELECTED_PROPERTY_TAB_INDEX]: (
    state: EditorContextState,
    action: { payload: { index: number; panelPropertyPath: string } },
  ) => {
    const { index, panelPropertyPath } = action.payload;
    if (!state.propertyPanelState[panelPropertyPath]) {
      state.propertyPanelState[panelPropertyPath] = {
        propertySectionState: {},
        selectedPropertyTabIndex: index,
      };
    } else {
      state.propertyPanelState[
        panelPropertyPath
      ].selectedPropertyTabIndex = index;
    }
  },
  [ReduxActionTypes.SET_PANEL_PROPERTY_SECTION_STATE]: (
    state: EditorContextState,
    action: {
      payload: { key: string; isOpen: boolean; panelPropertyPath: string };
    },
  ) => {
    const { isOpen, key, panelPropertyPath } = action.payload;
    if (!key) return;

    if (!state.propertyPanelState[panelPropertyPath]) {
      state.propertyPanelState[panelPropertyPath] = {
        propertySectionState: {},
        selectedPropertyTabIndex: 0,
      };
    }

    state.propertyPanelState[panelPropertyPath].propertySectionState[
      key
    ] = isOpen;
  },
  [ReduxActionTypes.SET_PANEL_PROPERTIES_STATE]: (
    state: EditorContextState,
    action: { payload: PropertyPanelState },
  ) => {
    state.propertyPanelState = action.payload;
  },
  [ReduxActionTypes.SET_ENTITY_COLLAPSIBLE_STATE]: (
    state: EditorContextState,
    action: { payload: { name: string; isOpen: boolean } },
  ) => {
    const { isOpen, name } = action.payload;
    if (isSubEntities(name)) state.subEntityCollapsibleFields[name] = isOpen;
    else state.entityCollapsibleFields[name] = isOpen;
  },
  [ReduxActionTypes.SET_ALL_ENTITY_COLLAPSIBLE_STATE]: (
    state: EditorContextState,
    action: { payload: { [key: string]: boolean } },
  ) => {
    state.entityCollapsibleFields = action.payload;
  },
  [ReduxActionTypes.SET_ALL_SUB_ENTITY_COLLAPSIBLE_STATE]: (
    state: EditorContextState,
    action: { payload: { [key: string]: boolean } },
  ) => {
    state.subEntityCollapsibleFields = action.payload;
  },
  [ReduxActionTypes.SET_EXPLORER_SWITCH_INDEX]: (
    state: EditorContextState,
    action: { payload: number },
  ) => {
    state.explorerSwitchIndex = action.payload;
  },
});
