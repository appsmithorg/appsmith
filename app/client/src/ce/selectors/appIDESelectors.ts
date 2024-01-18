import { groupBy, sortBy } from "lodash";
import { createSelector } from "reselect";
import type { EntityItem } from "@appsmith/selectors/entitiesSelector";
import {
  getJSSegmentItems,
  getQuerySegmentItems,
} from "@appsmith/selectors/entitiesSelector";

export type EditorSegmentList = Array<{
  group: string | "NA";
  items: EntityItem[];
}>;

const groupAndSortEntitySegmentList = (
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

function recentSortEntitySegmentTabs(items: EntityItem[]) {
  // TODO Temp implementation
  return sortBy(items, "title");
}

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

export const selectJSSegmentEditorTabs = createSelector(
  getJSSegmentItems,
  (items) => {
    return recentSortEntitySegmentTabs(items);
  },
);

export const selectQuerySegmentEditorTabs = createSelector(
  getQuerySegmentItems,
  (items) => {
    return recentSortEntitySegmentTabs(items);
  },
);
