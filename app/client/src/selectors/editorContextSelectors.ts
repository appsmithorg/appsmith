import type { DefaultRootState } from "react-redux";
import type { FeatureFlags } from "ee/entities/FeatureFlag";
import type {
  CodeEditorHistory,
  CursorPosition,
  EvaluatedPopupState,
  PropertyPanelContext,
  PropertyPanelState,
} from "ee/reducers/uiReducers/editorContextReducer";
import { isSubEntities } from "ee/reducers/uiReducers/editorContextReducer";
import { createSelector } from "reselect";
import { selectFeatureFlags } from "ee/selectors/featureFlagsSelectors";

export const getFocusableInputField = (state: DefaultRootState) =>
  state.ui.editorContext.focusedInputField;

export const getCodeEditorHistory = (state: DefaultRootState) =>
  state.ui.editorContext.codeEditorHistory;

export const getPropertyPanelState = (state: DefaultRootState) =>
  state.ui.editorContext.propertyPanelState;

export const getAllPropertySectionState = (state: DefaultRootState) =>
  state.ui.editorContext.propertySectionState;

export const getWidgetSelectedPropertyTabIndex = (state: DefaultRootState) =>
  state.ui.editorContext.selectedPropertyTabIndex;

export const getAllEntityCollapsibleStates = (state: DefaultRootState) =>
  state.ui.editorContext.entityCollapsibleFields;

export const getAllSubEntityCollapsibleStates = (state: DefaultRootState) =>
  state.ui.editorContext.subEntityCollapsibleFields;

export const getExplorerSwitchIndex = (state: DefaultRootState) =>
  state.ui.editorContext.explorerSwitchIndex;

export const getPanelPropertyContext = createSelector(
  getPropertyPanelState,
  (_state: DefaultRootState, panelPropertyPath: string | undefined) =>
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

export const getCodeEditorLastCursorPosition = createSelector(
  [
    getCodeEditorHistory,
    (state: DefaultRootState, key: string | undefined) => key,
  ],
  (
    codeEditorHistory: CodeEditorHistory,
    key: string | undefined,
  ): CursorPosition | undefined => {
    if (key === undefined) return;

    return codeEditorHistory[key]?.cursorPosition;
  },
);

export const getEvaluatedPopupState = createSelector(
  [
    getCodeEditorHistory,
    (_state: DefaultRootState, key: string | undefined) => key,
  ],
  (
    codeEditorHistory: CodeEditorHistory,
    key: string | undefined,
  ): EvaluatedPopupState | undefined => {
    return key ? codeEditorHistory?.[key]?.evalPopupState : undefined;
  },
);

export const getIsInputFieldFocused = createSelector(
  [
    getFocusableInputField,
    selectFeatureFlags,
    (_state: DefaultRootState, key: string | undefined) => key,
  ],
  (
    focusableField: string | undefined,
    featureFlags: FeatureFlags,
    key: string | undefined,
  ): boolean => {
    return !!(key && focusableField === key);
  },
);

const getPanelContext = (
  _state: DefaultRootState,
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
    (_state: DefaultRootState, entityName: string) => entityName,
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
