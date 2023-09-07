import { useRouteMatch } from "react-router";
import { IDE_PAGE_NAV_PATH, IDE_PATH } from "../../constants/routes";
import type { IDEAppState, PageNavState } from "./ideReducer";
import type { Item } from "./components/ListView";
import useRecentEntities from "../../components/editorComponents/GlobalSearch/useRecentEntities";
import { useEffect, useState } from "react";
import _, { findIndex } from "lodash";

export const useIDENavState = (): [
  { ideState?: IDEAppState; pageNav?: PageNavState; pageId?: string },
] => {
  const appNavState = useRouteMatch<{ ideState: IDEAppState }>({
    path: IDE_PATH,
  });
  const pageNavState = useRouteMatch<{ pageNav: PageNavState; pageId: string }>(
    {
      path: IDE_PAGE_NAV_PATH,
    },
  );
  const ideNavState = { ...appNavState?.params, ...pageNavState?.params };
  return [ideNavState];
};

/**
 * Given the list of items and a currently selected item
 * provide a sorted list where top 4 items are recently used.
 * if the current item is not in the top 4, add it and return the new list
 * if the current item is already in the top 4, no change to list
 **/

export const useIDEPageRecent = (
  items: Item[],
  currentItemId?: string,
): [sortedItems: Item[]] => {
  const recentEntities = useRecentEntities();
  const [sortedItems, setSortedItems] = useState<Item[]>([]);

  const newSortedList = items.sort((a: any, b: any) => {
    const indexA = findIndex(
      recentEntities,
      (r: any) => r.config?.id === a.key,
    );
    const indexB = findIndex(
      recentEntities,
      (r: any) => r.config?.id === b.key,
    );
    if (indexA > -1 && indexB > -1) return indexA - indexB;
    if (indexA === -1 && indexB > -1) return 1;
    if (indexA > -1 && indexB === -1) return -1;
    return 0;
  });
  useEffect(() => {
    if (sortedItems.length === 0) {
      setSortedItems(newSortedList);
    }
  }, [sortedItems, newSortedList]);

  useEffect(() => {
    if (currentItemId) {
      const indexOfCurrentItem = _.findIndex(
        sortedItems,
        (r) => r.key === currentItemId,
      );
      if (indexOfCurrentItem > 3) {
        setSortedItems(newSortedList);
      }
    }
  }, [currentItemId, sortedItems, newSortedList]);
  return [
    sortedItems.map((item) => ({
      ...item,
      selected: item.key === currentItemId,
    })),
  ];
};
