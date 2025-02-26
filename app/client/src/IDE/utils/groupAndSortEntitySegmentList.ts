import { groupBy, sortBy } from "lodash";
import type { EntityItem } from "ee/IDE/Interfaces/EntityItem";

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
