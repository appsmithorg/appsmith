import { AppState } from "@appsmith/reducers";
import {
  CodeEditorHistory,
  EvaluatedPopupState,
  PropertyPanelContext,
  PropertyPanelState,
  SelectedPropertyPanel,
} from "reducers/uiReducers/editorContextReducer";
import { createSelector } from "reselect";

export const getFocusableField = (state: AppState) =>
  state.ui.editorContext.focusableField;

export const getCodeEditorHistory = (state: AppState) =>
  state.ui.editorContext.codeEditorHistory;

export const getSelectedPropertyPanel = (state: AppState) =>
  state.ui.editorContext.selectedPropertyPanel;

export const getPropertyPanelState = (state: AppState) =>
  state.ui.editorContext.propertyPanelState;

export const getAllPropertySectionState = (state: AppState) =>
  state.ui.editorContext.propertySectionState;

export const getSelectedCanvasDebuggerTab = (state: AppState) =>
  state.ui.editorContext.selectedDebuggerTab;

export const getWidgetSelectedPropertyTabIndex = (state: AppState) =>
  state.ui.editorContext.selectedPropertyTabIndex;

export const getAllEntityCollapsibleStates = (state: AppState) =>
  state.ui.editorContext.entityCollapsibleFields;

export const getExplorerSwitchIndex = (state: AppState) =>
  state.ui.editorContext.explorerSwitchIndex;

export const getPanelPropertyContext = createSelector(
  getSelectedPropertyPanel,
  getPropertyPanelState,
  (
    selectedPropertyPanel: SelectedPropertyPanel | undefined,
    propertyPanelState: PropertyPanelState,
  ) => {
    if (!selectedPropertyPanel || !selectedPropertyPanel.path) return;

    return propertyPanelState[selectedPropertyPanel.path];
  },
);

export const getSelectedPropertyTabIndex = createSelector(
  [
    getWidgetSelectedPropertyTabIndex,
    getPanelPropertyContext,
    (_state: AppState, isPanelProperty: boolean) => isPanelProperty,
  ],
  (
    selectedPropertyTabIndex: number,
    propertyPanelContext: PropertyPanelContext | undefined,
    isPanelProperty: boolean,
  ) => {
    if (
      propertyPanelContext &&
      propertyPanelContext.selectedPropertyTabIndex !== undefined &&
      isPanelProperty
    )
      return propertyPanelContext.selectedPropertyTabIndex;
    return selectedPropertyTabIndex;
  },
);

// export const getIsCodeEditorFocused = createSelector(
//   [getFocusableField, (_state: AppState, key: string | undefined) => key],
//   (focusableField: string | undefined, key: string | undefined): boolean => {
//     if (key) {
//       return focusableField === key;
//     }
//     return false;
//   },
// );

export const getshouldFocusPropertyPath = createSelector(
  [
    getFocusableField,
    getPanelPropertyContext,
    (_state: AppState, key: string | undefined) => key,
  ],
  (
    focusableField: string | undefined,
    propertyPanelContext: PropertyPanelContext | undefined,
    key: string | undefined,
  ): boolean => {
    if (propertyPanelContext?.focusableField)
      return !!(key && propertyPanelContext.focusableField === key);
    return !!(key && focusableField === key);
  },
);

export const getEvaluatedPopupState = createSelector(
  [getCodeEditorHistory, (_state: AppState, key: string | undefined) => key],
  (
    codeEditorHistory: CodeEditorHistory,
    key: string | undefined,
  ): EvaluatedPopupState | undefined => {
    return key ? codeEditorHistory?.[key]?.evalPopupState : undefined;
  },
);

export const getPropertySectionState = createSelector(
  [
    getAllPropertySectionState,
    getPanelPropertyContext,
    (_state: AppState, key: string) => key,
  ],
  (
    propertySectionState: { [key: string]: boolean },
    propertyPanelContext: PropertyPanelContext | undefined,
    key: string,
  ): boolean | undefined => {
    if (propertyPanelContext?.propertySectionState)
      return propertyPanelContext.propertySectionState[key];
    return propertySectionState[key];
  },
);

export const getSelectedPropertyPanelIndex = createSelector(
  [getSelectedPropertyPanel, (_state: AppState, path: string) => path],
  (
    selectedPropertyPanel: SelectedPropertyPanel | undefined,
    path: string,
  ): number | undefined => {
    return selectedPropertyPanel?.path === path
      ? selectedPropertyPanel?.index
      : undefined;
  },
);

export const getEntityCollapsibleState = createSelector(
  [
    getAllEntityCollapsibleStates,
    (_state: AppState, entityName: string) => entityName,
  ],
  (
    entityCollapsibleStates: { [key: string]: boolean },
    entityName: string,
  ): boolean | undefined => {
    return entityCollapsibleStates[entityName];
  },
);
