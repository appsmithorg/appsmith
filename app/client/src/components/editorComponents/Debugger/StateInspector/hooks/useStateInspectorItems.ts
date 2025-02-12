import { useEffect, useMemo } from "react";
import { useStateInspectorState } from "./useStateInspectorState";
import { useGetGlobalItemsForStateInspector } from "./useGetGlobalItemsForStateInspector";
import { useGetQueryItemsForStateInspector } from "./useGetQueryItemsForStateInspector";
import { useGetJSItemsForStateInspector } from "./useGetJSItemsForStateInspector";
import { useGetUIItemsForStateInspector } from "./useGetUIItemsForStateInspector";
import type { GroupedItems } from "../types";
import { enhanceItemForListItem } from "../utils";
import type { GenericEntityItem } from "ee/IDE/Interfaces/EntityItem";

export const useStateInspectorItems: () => [
  GenericEntityItem | undefined,
  GroupedItems[],
] = () => {
  const [selectedItemId, setSelectedItem] = useStateInspectorState();

  const queries = useGetQueryItemsForStateInspector();
  const jsItems = useGetJSItemsForStateInspector();
  const uiItems = useGetUIItemsForStateInspector();
  const globalItems = useGetGlobalItemsForStateInspector();

  const [groups, selectedItem] = useMemo(() => {
    const allGroups = [queries, jsItems, uiItems, globalItems];

    const processedGroups = allGroups
      .filter((groupedItems) => groupedItems.items.length > 0)
      .map((groupedItems) => ({
        group: groupedItems.group,
        items: groupedItems.items.map((item) =>
          enhanceItemForListItem(item, selectedItemId, setSelectedItem),
        ),
      }));

    const selectedItemFromGroups = processedGroups
      .flatMap((group) => group.items)
      .find((item) => item.id === selectedItemId);

    const selectedItem: GenericEntityItem | undefined = {
      key: selectedItemFromGroups?.id || "",
      title: selectedItemFromGroups?.title || "",
      icon: selectedItemFromGroups?.startIcon,
    };

    return [processedGroups, selectedItem];
  }, [globalItems, jsItems, queries, selectedItemId, setSelectedItem, uiItems]);

  useEffect(
    function handleNoItemSelected() {
      if (!selectedItemId) {
        const firstItem = groups[0].items[0];

        setSelectedItem(firstItem.id as string);
      }
    },
    [groups, selectedItemId, setSelectedItem],
  );

  return [selectedItem, groups];
};
