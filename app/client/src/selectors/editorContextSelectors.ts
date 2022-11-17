import { AppState } from "@appsmith/reducers";
import {
  CodeEditorHistory,
  CursorPosition,
  EvaluatedPopupState,
} from "reducers/uiReducers/editorContextReducer";
import { createSelector } from "reselect";
import { generatePropertyKey } from "utils/editorContextUtils";
import { getCurrentPageId } from "./editorSelectors";
import { selectFeatureFlags } from "selectors/usersSelectors";
import FeatureFlags from "entities/FeatureFlags";

export const getFocusableCodeEditorField = (state: AppState) =>
  state.ui.editorContext.focusableCodeEditor;

export const getCodeEditorHistory = (state: AppState) =>
  state.ui.editorContext.codeEditorHistory;

export const getIsCodeEditorFocused = createSelector(
  [
    getCurrentPageId,
    getFocusableCodeEditorField,
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

export const getCodeEditorLastCursorPosition = createSelector(
  [
    getCurrentPageId,
    getCodeEditorHistory,
    (state: AppState, key: string | undefined) => key,
  ],
  (
    pageId: string,
    codeEditorHistory: CodeEditorHistory,
    key: string | undefined,
  ): CursorPosition | undefined => {
    if (key === undefined) return;
    const propertyFieldKey = generatePropertyKey(key, pageId);
    if (propertyFieldKey && propertyFieldKey in codeEditorHistory) {
      return codeEditorHistory[propertyFieldKey].cursorPosition;
    }
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
