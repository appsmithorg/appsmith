import { useParams, useRouteMatch } from "react-router";
import { IDE_PAGE_NAV_PATH, IDE_PATH } from "../../constants/routes";
import type { IDEAppState, PageNavState } from "./ideReducer";
import type { Item } from "./components/ListView";
import useRecentEntities from "../../components/editorComponents/GlobalSearch/useRecentEntities";
import { useEffect, useState } from "react";
import _, { findIndex, keyBy } from "lodash";
import { useAppWideAndOtherDatasource } from "pages/Editor/Explorer/hooks";
import { useSelector } from "react-redux";
import { getPlugins } from "selectors/entitiesSelector";
import { PluginType } from "entities/Action";
import { getPluginIcon } from "pages/Editor/Explorer/ExplorerIcons";

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
    if (newSortedList.length === 0) return;
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

export const useIDEDatasources = () => {
  const { otherDS } = useAppWideAndOtherDatasource();
  const plugins = useSelector(getPlugins);
  const pluginByKey = keyBy(plugins, "id");
  const params = useParams<{ appId: string; dataId?: string }>();
  const otherItems = otherDS
    .filter((item) => {
      const plugin = pluginByKey[item.pluginId];
      if (plugin) {
        return plugin.type !== PluginType.SAAS;
      }
      return false;
    })
    .map((item) => {
      const plugin = pluginByKey[item.pluginId];
      return {
        key: item.id,
        name: item.name,
        icon: getPluginIcon(plugin),
        selected: item.id === params.dataId,
      };
    });

  return otherItems;
};
