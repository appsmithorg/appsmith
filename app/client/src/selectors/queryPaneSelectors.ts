import type { AppState } from "@appsmith/reducers";
import { getQuerySegmentItems } from "@appsmith/selectors/entitiesSelector";
import { getCurrentPageId } from "./editorSelectors";
import type { FocusEntityInfo } from "../navigation/FocusEntity";
import { identifyEntityFromPath } from "../navigation/FocusEntity";
import { getQueryEntityItemUrl } from "@appsmith/pages/Editor/IDE/EditorPane/Query/utils";

export const getQueryPaneConfigSelectedTabIndex = (state: AppState) =>
  state.ui.queryPane.selectedConfigTabIndex;

export const getFirstQuery = (state: AppState): FocusEntityInfo | undefined => {
  const queryItems = getQuerySegmentItems(state);
  const pageId = getCurrentPageId(state);
  if (queryItems.length) {
    const url = getQueryEntityItemUrl(queryItems[0], pageId);
    const urlWithoutQueryParams = url.split("?")[0];
    return identifyEntityFromPath(urlWithoutQueryParams);
  }
};

export const getQueryPaneDebuggerState = (state: AppState) =>
  state.ui.queryPane.debugger;

export const getQueryRunErrorMessage = (state: AppState, id: string) => {
  const { runErrorMessage } = state.ui.queryPane;
  return runErrorMessage[id];
};

export const getQueryIsRunning = (state: AppState, id: string): boolean => {
  const { isRunning } = state.ui.queryPane;
  return !!isRunning[id];
};
