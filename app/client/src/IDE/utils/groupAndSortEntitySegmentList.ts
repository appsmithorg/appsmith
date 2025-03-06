import type { EntityItem } from "ee/IDE/Interfaces/EntityItem";
import { groupBy, sortBy } from "lodash";

export type EditorSegmentList<T> = Array<{
  group: string | "NA";
  items: T[];
}>;

export const groupAndSortEntitySegmentList = <T extends EntityItem>(
  items: T[],
): EditorSegmentList<T> => {
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
