import { AppState } from "@appsmith/reducers";
import {
  CodeEditorHistory,
  EvaluatedPopupState,
} from "reducers/uiReducers/editorContextReducer";
import { createSelector } from "reselect";
import { generatePropertyKey } from "utils/editorContextUtils";
import { getCurrentPageId } from "./editorSelectors";
import { selectFeatureFlags } from "selectors/usersSelectors";
import FeatureFlags from "entities/FeatureFlags";

export const getFocusableField = (state: AppState) =>
  state.ui.editorContext.focusableField;

export const getCodeEditorHistory = (state: AppState) =>
  state.ui.editorContext.codeEditorHistory;

export const getIsCodeEditorFocused = createSelector(
  [
    getCurrentPageId,
    getFocusableField,
    selectFeatureFlags,
    (_state: AppState, key: string | undefined) => key,
  ],
  (
    pageId: string,
    focusableField: string | undefined,
    featureFlags: FeatureFlags,
    key: string | undefined,
  ): boolean => {
    if (featureFlags.CONTEXT_SWITCHING) {
      const propertyFieldKey = generatePropertyKey(key, pageId);
      if (propertyFieldKey) {
        return focusableField === propertyFieldKey;
      }
    }
    return false;
  },
);

export const getshouldFocusPropertyPath = createSelector(
  [
    getFocusableField,
    getCurrentPageId,
    (_state: AppState, key: string | undefined) => key,
  ],
  (
    focusableField: string | undefined,
    pageId: string,
    key: string | undefined,
  ): boolean => {
    const propertyFieldKey = generatePropertyKey(key, pageId);
    return !!(propertyFieldKey && focusableField === propertyFieldKey);
  },
);

export const getEvaluatedPopupState = createSelector(
  [
    getCodeEditorHistory,
    getCurrentPageId,
    (_state: AppState, key: string | undefined) => key,
  ],
  (
    codeEditorHistory: CodeEditorHistory,
    pageId: string,
    key: string | undefined,
  ): EvaluatedPopupState | undefined => {
    const propertyFieldKey = generatePropertyKey(key, pageId);
    return propertyFieldKey
      ? codeEditorHistory?.[propertyFieldKey]?.evalPopupState
      : undefined;
  },
);

export const getAllPropertySectionState = (state: AppState) =>
  state.ui.editorContext.propertySectionState;

export const getPropertySectionState = createSelector(
  [getAllPropertySectionState, (_state: AppState, key: string) => key],
  (
    propertySectionState: { [key: string]: boolean },
    key: string,
  ): boolean | undefined => {
    return propertySectionState[key];
  },
);

export const getSelectedPropertyTabIndex = (state: AppState) =>
  state.ui.editorContext.selectedPropertyTabIndex;

export const getSelectedCanvasDebuggerTab = (state: AppState) =>
  state.ui.editorContext.selectedDebuggerTab;
