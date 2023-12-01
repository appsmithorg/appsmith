import type { AppState } from "@appsmith/reducers";
import { getCurrentJSCollections } from "@appsmith/selectors/entitiesSelector";

export const getJSPaneConfigSelectedTab = (state: AppState) =>
  state.ui.jsPane.selectedConfigTab;

export const getFirstJSObjectId = (state: AppState) => {
  const currentJSActions = getCurrentJSCollections(state);
  if (currentJSActions.length) {
    return currentJSActions[0].config.id;
  }
};
