import type { AppState } from "ee/reducers";
import { getCurrentPageId } from "./editorSelectors";
import type { FocusEntityInfo } from "../navigation/FocusEntity";
import { identifyEntityFromPath } from "../navigation/FocusEntity";
import { getQueryEntityItemUrl } from "ee/pages/Editor/IDE/EditorPane/Query/utils";
import { selectQuerySegmentEditorTabs } from "ee/selectors/appIDESelectors";

export const getQueryPaneConfigSelectedTabIndex = (state: AppState) =>
  state.ui.queryPane.selectedConfigTabIndex;

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

export const getLastQueryTab = (
  state: AppState,
): FocusEntityInfo | undefined => {
  const tabs = selectQuerySegmentEditorTabs(state);
  const pageId = getCurrentPageId(state);

  if (tabs.length) {
    const url = getQueryEntityItemUrl(tabs[tabs.length - 1], pageId);
    const urlWithoutQueryParams = url.split("?")[0];

    return identifyEntityFromPath(urlWithoutQueryParams);
  }
};
