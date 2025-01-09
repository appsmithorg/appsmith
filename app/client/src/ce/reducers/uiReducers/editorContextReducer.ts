import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "../../../actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

export enum CursorPositionOrigin {
  Navigation = "Navigation",
  LastFocus = "LastFocus",
}

export interface CursorPosition {
  line: number;
  ch: number;
  origin: CursorPositionOrigin;
}

export interface EvaluatedPopupState {
  type: boolean;
  example: boolean;
  value: boolean;
}

export interface CodeEditorContext {
  cursorPosition?: CursorPosition;
  evalPopupState?: EvaluatedPopupState;
}

export interface PropertyPanelContext {
  propertySectionState: Record<string, boolean>;
  selectedPropertyTabIndex: number;
}

export interface PropertyPanelState {
  [key: string]: PropertyPanelContext;
}

export type CodeEditorHistory = Record<string, CodeEditorContext>;

export interface EditorContextState {
  entityCollapsibleFields: Record<string, boolean>;
  subEntityCollapsibleFields: Record<string, boolean>;
  explorerSwitchIndex: number;
  focusedInputField?: string;
  codeEditorHistory: Record<string, CodeEditorContext>;
  propertySectionState: Record<string, boolean>;
  selectedPropertyTabIndex: number;
  propertyPanelState: PropertyPanelState;
}

export const initialState: EditorContextState = {
  codeEditorHistory: {},
  propertySectionState: {},
  selectedPropertyTabIndex: 0,
  propertyPanelState: {},
  entityCollapsibleFields: {},
  subEntityCollapsibleFields: {},
  explorerSwitchIndex: 0,
};

export const entitySections = {
  Pages: "Pages",
  Widgets: "Widgets",
  ["Queries/JS"]: "Queries/JS",
  Datasources: "Datasources",
  Libraries: "Libraries",
  Queries: "Queries",
  JSModules: "JSModules",
};

export const isSubEntities = (name: string): boolean => {
  return !(name in entitySections);
};

export const handlers = {
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
      state.propertyPanelState[panelPropertyPath].selectedPropertyTabIndex =
        index;
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

    state.propertyPanelState[panelPropertyPath].propertySectionState[key] =
      isOpen;
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
  [ReduxActionTypes.WIDGET_ADD_CHILD]: (state: EditorContextState) => {
    state.entityCollapsibleFields[entitySections.Widgets] = true;
  },
  [ReduxActionTypes.CREATE_ACTION_SUCCESS]: (state: EditorContextState) => {
    state.entityCollapsibleFields[entitySections["Queries/JS"]] = true;
  },
  [ReduxActionTypes.CREATE_JS_ACTION_SUCCESS]: (state: EditorContextState) => {
    state.entityCollapsibleFields[entitySections["Queries/JS"]] = true;
  },
  [ReduxActionTypes.CREATE_DATASOURCE_SUCCESS]: (state: EditorContextState) => {
    state.entityCollapsibleFields[entitySections.Datasources] = true;
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
  [ReduxActionTypes.SET_FORCE_WIDGET_PANEL_OPEN]: (
    state: EditorContextState,
    action: ReduxAction<boolean>,
  ) => {
    state.explorerSwitchIndex = action.payload ? 1 : 0;
  },
};

/**
 * Context Reducer to store states of different components of editor
 */
export const editorContextReducer = createImmerReducer(initialState, handlers);
