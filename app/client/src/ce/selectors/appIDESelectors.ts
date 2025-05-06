import { keyBy } from "lodash";
import { createSelector } from "reselect";
import {
  getJSSegmentItems,
  getQuerySegmentItems,
} from "ee/selectors/entitiesSelector";
import { getJSTabs, getQueryTabs } from "selectors/ideSelectors";
import type { DefaultRootState } from "react-redux";
import { identifyEntityFromPath } from "navigation/FocusEntity";
import { getCurrentBasePageId } from "selectors/editorSelectors";
import { getQueryEntityItemUrl } from "ee/pages/AppIDE/layouts/routers/utils/getQueryEntityItemUrl";
import { groupAndSortEntitySegmentList } from "IDE/utils/groupAndSortEntitySegmentList";

export const selectQuerySegmentEditorList = createSelector(
  getQuerySegmentItems,
  (items) => {
    return groupAndSortEntitySegmentList(items);
  },
);
export const selectJSSegmentEditorList = createSelector(
  getJSSegmentItems,
  (items) => {
    return groupAndSortEntitySegmentList(items);
  },
);

export const selectJSSegmentEditorTabs = (state: DefaultRootState) => {
  const items = getJSSegmentItems(state);
  const tabs = getJSTabs(state);

  const keyedItems = keyBy(items, "key");

  return tabs
    .map((tab) => {
      return keyedItems[tab];
    })
    .filter(Boolean);
};

export const selectQuerySegmentEditorTabs = (state: DefaultRootState) => {
  const items = getQuerySegmentItems(state);
  const tabs = getQueryTabs(state);

  const keyedItems = keyBy(items, "key");

  return tabs.map((tab) => keyedItems[tab]).filter(Boolean);
};

export const getLastQueryTab = createSelector(
  selectQuerySegmentEditorTabs,
  getCurrentBasePageId,
  (tabs, basePageId) => {
    if (tabs.length) {
      const url = getQueryEntityItemUrl(tabs[tabs.length - 1], basePageId);
      const urlWithoutQueryParams = url.split("?")[0];

      return identifyEntityFromPath(urlWithoutQueryParams);
    }
  },
);
