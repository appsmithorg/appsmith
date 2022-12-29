export * from "ce/selectors/workspaceSelectors";
import { AppState } from "@appsmith/reducers";

export const getGroupSuggestions = (state: AppState) => {
  return state.ui.workspaces.groupSuggestions;
};
