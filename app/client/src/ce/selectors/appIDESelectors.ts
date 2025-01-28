import { groupBy, keyBy, sortBy } from "lodash";
import { createSelector } from "reselect";
import type { EntityItem } from "ee/entities/IDE/constants";
import {
  getJSSegmentItems,
  getQuerySegmentItems,
} from "ee/selectors/entitiesSelector";
import { getJSTabs, getQueryTabs } from "selectors/ideSelectors";
import type { AppState } from "ee/reducers";
import { identifyEntityFromPath } from "navigation/FocusEntity";
import { getCurrentBasePageId } from "selectors/editorSelectors";
import { getQueryEntityItemUrl } from "ee/pages/Editor/IDE/EditorPane/Query/utils/getQueryEntityItemUrl";

export type EditorSegmentList = Array<{
  group: string | "NA";
  items: EntityItem[];
}>;

export const groupAndSortEntitySegmentList = (
  items: EntityItem[],
): EditorSegmentList => {
  const groups = groupBy(items, (item) => {
    if (item.group) return item.group;

    return "NA";
  });

  // Entity Segment Lists are sorted alphabetically at both group and item level
  return sortBy(
    Object.keys(groups).map((group) => {
      return {
        group: group,
        items: sortBy(groups[group], "title"),
      };
    }),
    "group",
  );
};

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

export const selectJSSegmentEditorTabs = (state: AppState) => {
  const items = getJSSegmentItems(state);
  const tabs = getJSTabs(state);

  const keyedItems = keyBy(items, "key");

  return tabs
    .map((tab) => {
      return keyedItems[tab];
    })
    .filter(Boolean);
};

export const selectQuerySegmentEditorTabs = (state: AppState) => {
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
