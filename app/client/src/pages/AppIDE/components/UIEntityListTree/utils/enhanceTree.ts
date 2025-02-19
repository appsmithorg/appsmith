import type { CanvasStructure } from "reducers/uiReducers/pageCanvasStructureReducer";
import type { EntityListTreeItem } from "@appsmith/ads";

export const enhanceItemsTree = (
  items: CanvasStructure[],
  enhancer: (item: CanvasStructure) => EntityListTreeItem,
) => {
  return items.map((child): EntityListTreeItem => {
    return {
      ...enhancer(child),
      children: child.children
        ? enhanceItemsTree(child.children, enhancer)
        : undefined,
    };
  });
};
