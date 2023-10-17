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
import { deriveAlignedColumnHighlights } from "layoutSystems/anvil/utils/layouts/highlights/alignedColumnHighlights";
import type { WidgetPositions } from "layoutSystems/common/types";

const AlignedColumn = (props: LayoutComponentProps) => {
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

AlignedColumn.type = LayoutComponentTypes.ALIGNED_COLUMN;

AlignedColumn.addChild = (
  props: LayoutProps,
  children: WidgetLayoutProps[] | LayoutProps[],
  highlight: AnvilHighlightInfo,
): LayoutProps => {
  return addChildToLayout(props, children, highlight);
};

AlignedColumn.getChildTemplate = (
  props: LayoutProps,
): LayoutProps | undefined => {
  if (!props) return;
  const { childTemplate } = props;
  if (childTemplate) return childTemplate;
  return {
    insertChild: true,
    layoutId: "",
    layoutType: LayoutComponentTypes.ALIGNED_ROW,
    layout: [],
  };
};

AlignedColumn.deriveHighlights = (
  layoutProps: LayoutProps,
  widgetPositions: WidgetPositions,
  canvasId: string,
  draggedWidgets: DraggedWidget[],
  layoutOrder: string[],
  parentDropTarget: string,
): AnvilHighlightInfo[] => {
  return deriveAlignedColumnHighlights(
    layoutProps,
    widgetPositions,
    canvasId,
    draggedWidgets,
    layoutOrder || [],
    parentDropTarget,
  );
};

AlignedColumn.extractChildWidgetIds = (props: LayoutProps): string[] => {
  return AlignedColumn.rendersWidgets(props)
    ? extractWidgetIdsFromLayoutProps(props)
    : [];
};

AlignedColumn.removeChild = (
  props: LayoutProps,
  child: WidgetLayoutProps | LayoutProps,
): LayoutProps | undefined => {
  return removeChildFromLayout(props, child);
};

AlignedColumn.renderChildWidgets = (
  props: LayoutComponentProps,
): React.ReactNode => {
  return renderWidgets(props);
};

AlignedColumn.rendersWidgets = (props: LayoutProps): boolean => {
  return doesLayoutRenderWidgets(props);
};

export default AlignedColumn;
