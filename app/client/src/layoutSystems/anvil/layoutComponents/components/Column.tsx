import React from "react";
import { FlexLayout } from "./FlexLayout";
import {
  LayoutComponentTypes,
  type AnvilHighlightInfo,
  type LayoutComponentProps,
  type LayoutProps,
  type WidgetLayoutProps,
  type DraggedWidget,
} from "layoutSystems/anvil/utils/anvilTypes";
import { doesLayoutRenderWidgets } from "layoutSystems/anvil/utils/layouts/typeUtils";
import { renderWidgets } from "layoutSystems/anvil/utils/layouts/renderUtils";
import {
  addChildToLayout,
  extractWidgetIdsFromLayoutProps,
  removeChildFromLayout,
} from "layoutSystems/anvil/utils/layouts/layoutUtils";
import { deriveColumnHighlights } from "layoutSystems/anvil/utils/layouts/highlights/columnHighlights";
import type { WidgetPositions } from "layoutSystems/common/types";

const Column = (props: LayoutComponentProps) => {
  const { canvasId, children, isDropTarget, layoutId, layoutStyle } = props;

  return (
    <FlexLayout
      canvasId={canvasId}
      direction="column"
      isDropTarget={!!isDropTarget}
      layoutId={layoutId}
      {...(layoutStyle || {})}
    >
      {children}
    </FlexLayout>
  );
};

Column.type = LayoutComponentTypes.COLUMN;

Column.addChild = (
  props: LayoutProps,
  children: WidgetLayoutProps[] | LayoutProps[],
  highlight: AnvilHighlightInfo,
): LayoutProps => {
  return addChildToLayout(props, children, highlight);
};

Column.getChildTemplate = (props: LayoutProps): LayoutProps | undefined => {
  if (!props) return;
  const { childTemplate } = props;
  if (childTemplate) return childTemplate;
  return {
    insertChild: true,
    layoutId: "",
    layoutType: LayoutComponentTypes.ROW,
    layout: [],
  };
};

Column.deriveHighlights = (
  layoutProps: LayoutProps,
  widgetPositions: WidgetPositions,
  canvasId: string,
  draggedWidgets: DraggedWidget[],
  layoutOrder: string[],
  parentDropTarget: string,
): AnvilHighlightInfo[] => {
  return deriveColumnHighlights(
    layoutProps,
    widgetPositions,
    canvasId,
    draggedWidgets,
    layoutOrder || [],
    parentDropTarget,
  );
};

Column.extractChildWidgetIds = (props: LayoutProps): string[] => {
  return Column.rendersWidgets(props)
    ? extractWidgetIdsFromLayoutProps(props)
    : [];
};

Column.removeChild = (
  props: LayoutProps,
  child: WidgetLayoutProps | LayoutProps,
): LayoutProps | undefined => {
  return removeChildFromLayout(props, child);
};

Column.renderChildWidgets = (props: LayoutComponentProps): React.ReactNode => {
  return renderWidgets(props);
};

Column.rendersWidgets = (props: LayoutProps): boolean => {
  return doesLayoutRenderWidgets(props);
};

export default Column;
