import type { AppState } from "ee/reducers";
import { getJSEntityItemUrl } from "ee/pages/Editor/IDE/EditorPane/JS/utils";
import type { FocusEntityInfo } from "navigation/FocusEntity";
import { identifyEntityFromPath } from "navigation/FocusEntity";
import { selectJSSegmentEditorTabs } from "ee/selectors/appIDESelectors";
import { getCurrentBasePageId } from "./editorSelectors";

export const getJSPaneConfigSelectedTab = (state: AppState) =>
  state.ui.jsPane.selectedConfigTab;

export const getJsPaneDebuggerState = (state: AppState) =>
  state.ui.jsPane.debugger;

export const getLastJSTab = (state: AppState): FocusEntityInfo | undefined => {
  const tabs = selectJSSegmentEditorTabs(state);
  const basePageId = getCurrentBasePageId(state);

  if (tabs.length) {
    const url = getJSEntityItemUrl(tabs[tabs.length - 1], basePageId);
    const urlWithoutQueryParams = url.split("?")[0];

    return identifyEntityFromPath(urlWithoutQueryParams);
  }
};
