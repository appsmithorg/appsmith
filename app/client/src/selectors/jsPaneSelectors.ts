import type { AppState } from "@appsmith/reducers";

export const getJSPaneConfigSelectedTab = (state: AppState) =>
  state.ui.jsPane.selectedConfigTab;

export const getFirstJSObjectId = (state: AppState) => {
  const { jsActions } = state.entities;
  if (jsActions.length) {
    return jsActions[0].config.id;
  }
};
