import { AppState } from "@appsmith/reducers";
import {
  CodeEditorHistory,
  CursorPosition,
  EvaluatedPopupState,
} from "reducers/uiReducers/editorContextReducer";
import { createSelector } from "reselect";
import { generatePropertyKey } from "utils/editorContextUtils";
import { getCurrentPageId } from "./editorSelectors";

export const getFocusableField = (state: AppState) =>
  state.ui.editorContext.focusableField;

export const getCodeEditorHistory = (state: AppState) =>
  state.ui.editorContext.codeEditorHistory;

export const getCodeEditorCursorPosition = createSelector(
  [
    getCodeEditorHistory,
    getCurrentPageId,
    getFocusableField,
    (_state: AppState, key: string | undefined) => key,
  ],
  (
    codeEditorHistory: CodeEditorHistory,
    pageId: string,
    focusableField: string | undefined,
    key: string | undefined,
  ): CursorPosition | undefined => {
    const propertyFieldKey = generatePropertyKey(key, pageId);
    return propertyFieldKey && focusableField === propertyFieldKey
      ? codeEditorHistory?.[propertyFieldKey]?.cursorPosition
      : undefined;
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
