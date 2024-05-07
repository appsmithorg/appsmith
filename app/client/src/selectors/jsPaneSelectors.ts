import type { AppState } from "@appsmith/reducers";
import { getCurrentPageId } from "@appsmith/selectors/entitiesSelector";
import { getJSEntityItemUrl } from "@appsmith/pages/Editor/IDE/EditorPane/JS/utils";
import type { FocusEntityInfo } from "navigation/FocusEntity";
import { identifyEntityFromPath } from "navigation/FocusEntity";
import { selectJSSegmentEditorTabs } from "@appsmith/selectors/appIDESelectors";

export const getJSPaneConfigSelectedTab = (state: AppState) =>
  state.ui.jsPane.selectedConfigTab;

export const getJsPaneDebuggerState = (state: AppState) =>
  state.ui.jsPane.debugger;

export const getLastJSTab = (state: AppState): FocusEntityInfo | undefined => {
  const tabs = selectJSSegmentEditorTabs(state);
  const pageId = getCurrentPageId(state);
  if (tabs.length) {
    const url = getJSEntityItemUrl(tabs[tabs.length - 1], pageId);
    const urlWithoutQueryParams = url.split("?")[0];
    return identifyEntityFromPath(urlWithoutQueryParams);
  }
};
