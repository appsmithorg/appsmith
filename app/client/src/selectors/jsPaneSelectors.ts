import type { AppState } from "@appsmith/reducers";
import {
  getCurrentPageId,
  getJSSegmentItems,
} from "@appsmith/selectors/entitiesSelector";
import { getJSEntityItemUrl } from "@appsmith/pages/Editor/IDE/EditorPane/JS/utils";
import type { FocusEntityInfo } from "navigation/FocusEntity";
import { identifyEntityFromPath } from "navigation/FocusEntity";

export const getJSPaneConfigSelectedTab = (state: AppState) =>
  state.ui.jsPane.selectedConfigTab;

export const getFirstJSObject = (
  state: AppState,
): FocusEntityInfo | undefined => {
  const currentJSActions = getJSSegmentItems(state);
  const pageId = getCurrentPageId(state);
  if (currentJSActions.length) {
    return identifyEntityFromPath(
      getJSEntityItemUrl(currentJSActions[0], pageId),
    );
  }
};
