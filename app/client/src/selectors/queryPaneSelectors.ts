import type { AppState } from "@appsmith/reducers";
import type { QueryListState } from "@appsmith/navigation/FocusSelectors";
import { getPageActions } from "@appsmith/selectors/entitiesSelector";
import { getCurrentPageId } from "./editorSelectors";

export const getQueryPaneConfigSelectedTabIndex = (state: AppState) =>
  state.ui.queryPane.selectedConfigTabIndex;

export const getFirstQueryId = (state: AppState): QueryListState => {
  const { plugins } = state.entities;
  const pageId = getCurrentPageId(state);
  const currentPageActions = getPageActions(pageId)(state);
  if (currentPageActions.length) {
    const first = currentPageActions[0].config;
    const plugin = plugins.list.find((p) => p.id === first.pluginId);
    return {
      id: first.id,
      type: first.pluginType,
      pluginPackageName: plugin?.packageName,
    };
  }
};

export const getQueryRunErrorMessage = (state: AppState, id: string) => {
  const { runErrorMessage } = state.ui.queryPane;
  return runErrorMessage[id];
};

export const getQueryIsRunning = (state: AppState, id: string): boolean => {
  const { isRunning } = state.ui.queryPane;
  return !!isRunning[id];
};
