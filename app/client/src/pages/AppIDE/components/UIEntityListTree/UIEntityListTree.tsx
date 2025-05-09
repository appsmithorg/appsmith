import React from "react";
import { EntityListTree } from "@appsmith/ads";
import { useSelector } from "react-redux";
import { selectWidgetsForCurrentPage } from "ee/selectors/entitiesSelector";
import { getSelectedWidgets } from "selectors/ui";
import { useWidgetTreeState } from "./hooks/useWidgetTreeExpandedState";
import { enhanceItemsTree } from "./utils/enhanceTree";
import { WidgetTreeItem } from "./WidgetTreeItem";
import OrphanUIModuleInstancesEntityList from "ee/pages/AppIDE/components/UIEntityListTree/OrphanUIModuleInstancesEntityList";
export const UIEntityListTree = () => {
  const widgets = useSelector(selectWidgetsForCurrentPage);
  const selectedWidgets = useSelector(getSelectedWidgets);

  const { expandedWidgets, handleExpand } = useWidgetTreeState();

  const items = enhanceItemsTree(widgets?.children || [], (widget) => ({
    id: widget.widgetId,
    name: widget.widgetName,
    isSelected: selectedWidgets.includes(widget.widgetId),
    isExpanded: expandedWidgets.includes(widget.widgetId),
    type: widget.type,
    hasError: widget.hasError,
  }));

  return (
    <>
      <EntityListTree
        ItemComponent={WidgetTreeItem}
        items={items}
        onItemExpand={handleExpand}
      />
      <OrphanUIModuleInstancesEntityList />
    </>
  );
};
