import { AppState } from "@appsmith/reducers";
import {
  CodeEditorHistory,
  CursorPosition,
  EvaluatedPopupState,
  isSubEntities,
  PropertyPanelContext,
  PropertyPanelState,
} from "reducers/uiReducers/editorContextReducer";
import { createSelector } from "reselect";
import { selectFeatureFlags } from "selectors/usersSelectors";
import FeatureFlags from "entities/FeatureFlags";

export const getFocusableInputField = (state: AppState) =>
  state.ui.editorContext.focusedInputField;

export const getCodeEditorHistory = (state: AppState) =>
  state.ui.editorContext.codeEditorHistory;

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
  getPropertyPanelState,
  (_state: AppState, panelPropertyPath: string | undefined) =>
    panelPropertyPath,
  (
    propertyPanelState: PropertyPanelState,
    panelPropertyPath: string | undefined,
  ): PropertyPanelContext | undefined => {
    return panelPropertyPath
      ? propertyPanelState[panelPropertyPath]
      : undefined;
  },
);

export const getSelectedPropertyTabIndex = createSelector(
  [getWidgetSelectedPropertyTabIndex, getPanelPropertyContext],
  (
    selectedPropertyTabIndex: number,
    propertyPanelContext: PropertyPanelContext | undefined,
  ) => {
    if (
      propertyPanelContext &&
      propertyPanelContext.selectedPropertyTabIndex !== undefined
    )
      return propertyPanelContext.selectedPropertyTabIndex;
    return selectedPropertyTabIndex;
  },
);

export const getIsInputFieldFocused = createSelector(
  [
    getFocusableInputField,
    selectFeatureFlags,
    (_state: AppState, key: string | undefined) => key,
  ],
  (
    focusableField: string | undefined,
    featureFlags: FeatureFlags,
    key: string | undefined,
  ): boolean => {
    return !!(key && focusableField === key);
  },
);

export const getCodeEditorLastCursorPosition = createSelector(
  [getCodeEditorHistory, (state: AppState, key: string | undefined) => key],
  (
    codeEditorHistory: CodeEditorHistory,
    key: string | undefined,
  ): CursorPosition | undefined => {
    if (key === undefined) return;
    return codeEditorHistory[key]?.cursorPosition;
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

const getPanelContext = (
  _state: AppState,
  options: { key: string; panelPropertyPath: string | undefined },
) => {
  return {
    propertyPanelContext: getPanelPropertyContext(
      _state,
      options.panelPropertyPath,
    ),
    key: options.key,
  };
};
export const getPropertySectionState = createSelector(
  [getAllPropertySectionState, getPanelContext],
  (
    propertySectionState: { [key: string]: boolean },
    options: {
      key: string;
      propertyPanelContext: PropertyPanelContext | undefined;
    },
  ): boolean | undefined => {
    const { key, propertyPanelContext } = options;
    if (propertyPanelContext?.propertySectionState)
      return propertyPanelContext.propertySectionState[key];
    return propertySectionState[key];
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
