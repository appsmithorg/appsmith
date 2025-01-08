import { useEffect, useMemo } from "react";
import { useStateInspectorState } from "./useStateInspectorState";
import { useGetGlobalItemsForStateInspector } from "./useGetGlobalItemsForStateInspector";
import { useGetQueryItemsForStateInspector } from "./useGetQueryItemsForStateInspector";
import { useGetJSItemsForStateInspector } from "./useGetJSItemsForStateInspector";
import { useGetUIItemsForStateInspector } from "./useGetUIItemsForStateInspector";
import type { GroupedItems } from "../types";
import { enhanceItemForListItem } from "../utils";
import type { GenericEntityItem } from "ee/entities/IDE/constants";
import { filterInternalProperties } from "utils/FilterInternalProperties";
import { getConfigTree, getDataTree } from "selectors/dataTreeSelectors";
import { getJSCollections } from "ee/selectors/entitiesSelector";
import { useSelector } from "react-redux";

export const useStateInspectorItems: () => [
  GenericEntityItem | undefined,
  GroupedItems[],
  unknown,
] = () => {
  const [selectedItem, setSelectedItem] = useStateInspectorState();

  const queries = useGetQueryItemsForStateInspector();
  const jsItems = useGetJSItemsForStateInspector();
  const uiItems = useGetUIItemsForStateInspector();
  const globalItems = useGetGlobalItemsForStateInspector();

  const groups = useMemo(() => {
    const returnValue: GroupedItems[] = [];

    if (queries.items.length) {
      returnValue.push({
        ...queries,
        items: queries.items.map((query) =>
          enhanceItemForListItem(query, selectedItem, setSelectedItem),
        ),
      });
    }

    if (jsItems.items.length) {
      returnValue.push({
        ...jsItems,
        items: jsItems.items.map((jsItem) =>
          enhanceItemForListItem(jsItem, selectedItem, setSelectedItem),
        ),
      });
    }

    if (uiItems.items.length) {
      returnValue.push({
        ...uiItems,
        items: uiItems.items.map((uiItem) =>
          enhanceItemForListItem(uiItem, selectedItem, setSelectedItem),
        ),
      });
    }

    if (globalItems.items.length) {
      returnValue.push({
        ...globalItems,
        items: globalItems.items.map((globalItem) =>
          enhanceItemForListItem(globalItem, selectedItem, setSelectedItem),
        ),
      });
    }

    return returnValue;
  }, [globalItems, jsItems, queries, selectedItem, setSelectedItem, uiItems]);

  const dataTree = useSelector(getDataTree);
  const configTree = useSelector(getConfigTree);
  const jsActions = useSelector(getJSCollections);
  let filteredData: unknown = "";

  if (selectedItem && selectedItem.title in dataTree) {
    filteredData = filterInternalProperties(
      selectedItem.title,
      dataTree[selectedItem.title],
      jsActions,
      dataTree,
      configTree,
    );
  }

  useEffect(
    function handleNoItemSelected() {
      if (!selectedItem || !(selectedItem.title in dataTree)) {
        const firstItem = groups[0].items[0];

        setSelectedItem({
          key: firstItem.id as string,
          icon: firstItem.startIcon,
          title: firstItem.title,
        });
      }
    },
    [dataTree, groups, selectedItem, setSelectedItem],
  );

  return [selectedItem, groups, filteredData];
};
