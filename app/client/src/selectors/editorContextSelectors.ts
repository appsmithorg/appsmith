import { AppState } from "@appsmith/reducers";
import {
  CodeEditorHistory,
  EvaluatedPopupState,
  isSubEntities,
  PropertyPanelContext,
  PropertyPanelState,
  SelectedPropertyPanel,
} from "reducers/uiReducers/editorContextReducer";
import { createSelector } from "reselect";
import { selectFeatureFlags } from "selectors/usersSelectors";
import FeatureFlags from "entities/FeatureFlags";

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

export const getAllSubEntityCollapsibleStates = (state: AppState) =>
  state.ui.editorContext.subEntityCollapsibleFields;

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

export const getIsCodeEditorFocused = createSelector(
  [
    getFocusableField,
    getPanelPropertyContext,
    selectFeatureFlags,
    (_state: AppState, key: string | undefined) => key,
  ],
  (
    focusableField: string | undefined,
    propertyPanelContext: PropertyPanelContext | undefined,
    featureFlags: FeatureFlags,
    key: string | undefined,
  ): boolean => {
    if (featureFlags.CONTEXT_SWITCHING) {
      if (propertyPanelContext?.focusableField)
        return !!(key && propertyPanelContext.focusableField === key);
      return !!(key && focusableField === key);
    }
    return false;
  },
);

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
    getAllSubEntityCollapsibleStates,
    (_state: AppState, entityName: string) => entityName,
  ],
  (
    entityCollapsibleStates: { [key: string]: boolean },
    subEntityCollapsibleStates: { [key: string]: boolean },
    entityName: string,
  ): boolean | undefined => {
    if (isSubEntities(entityName))
      return subEntityCollapsibleStates[entityName];
    return entityCollapsibleStates[entityName];
  },
);
