import type { CanvasStructure } from "reducers/uiReducers/pageCanvasStructureReducer";
import type { EntityListTreeItem } from "@appsmith/ads";

export interface TreeEnhancementConfig {
  selectedIds: string[];
  expandedIds: string[];
  getIcon: (type: string) => React.ReactNode;
}

export const enhanceWidgetTree = (
  items: CanvasStructure[],
  config: TreeEnhancementConfig,
): EntityListTreeItem[] => {
  return items.map((item) => enhanceWidgetTreeItem(item, config));
};

export const enhanceWidgetTreeItem = (
  widget: CanvasStructure,
  config: TreeEnhancementConfig,
): EntityListTreeItem => ({
  id: widget.widgetId,
  title: widget.widgetName,
  startIcon: config.getIcon(widget.type),
  isSelected: config.selectedIds.includes(widget.widgetId),
  isExpanded: config.expandedIds.includes(widget.widgetId),
  children: widget.children ? enhanceWidgetTree(widget.children, config) : undefined,
});
