import type { DefaultRootState } from "react-redux";
import { getJSEntityItemUrl } from "ee/pages/AppIDE/layouts/routers/utils/getJSEntityItemUrl";
import type { FocusEntityInfo } from "navigation/FocusEntity";
import { identifyEntityFromPath } from "navigation/FocusEntity";
import { selectJSSegmentEditorTabs } from "ee/selectors/appIDESelectors";
import { getCurrentBasePageId } from "./editorSelectors";

export const getJSPaneConfigSelectedTab = (state: DefaultRootState) =>
  state.ui.jsPane.selectedConfigTab;

export const getJsPaneDebuggerState = (state: DefaultRootState) =>
  state.ui.jsPane.debugger;

export const getLastJSTab = (
  state: DefaultRootState,
): FocusEntityInfo | undefined => {
  const tabs = selectJSSegmentEditorTabs(state);
  const basePageId = getCurrentBasePageId(state);

  if (tabs.length) {
    const url = getJSEntityItemUrl(tabs[tabs.length - 1], basePageId);
    const urlWithoutQueryParams = url.split("?")[0];

    return identifyEntityFromPath(urlWithoutQueryParams);
  }
};

export const getIsJSCollectionSaving = (
  state: DefaultRootState,
  collectionId: string,
) => state.ui.jsPane.isSaving[collectionId];
