import type { AppState } from "@appsmith/reducers";

export const getQueryPaneConfigSelectedTabIndex = (state: AppState) =>
  state.ui.queryPane.selectedConfigTabIndex;

export const getFirstQueryId = (state: AppState) => {
  const { actions } = state.entities;
  if (actions.length) {
    return actions[0].config.id;
  }
};
