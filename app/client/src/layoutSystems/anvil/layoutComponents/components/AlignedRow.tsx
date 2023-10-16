import {
  LayoutComponentTypes,
  type AnvilHighlightInfo,
  type LayoutComponentProps,
  type LayoutProps,
  type WidgetLayoutProps,
  type DraggedWidget,
} from "layoutSystems/anvil/utils/anvilTypes";
import React from "react";
import { FlexLayout } from "./FlexLayout";
import { doesLayoutRenderWidgets } from "layoutSystems/anvil/utils/layouts/typeUtils";
import {
  addChildToLayout,
  extractWidgetIdsFromLayoutProps,
  removeChildFromLayout,
} from "layoutSystems/anvil/utils/layouts/layoutUtils";
import { renderWidgetsInAlignedRow } from "layoutSystems/anvil/utils/layouts/renderUtils";
import { deriveAlignedRowHighlights } from "layoutSystems/anvil/utils/layouts/highlights/alignedRowHighlights";
import type { WidgetPositions } from "layoutSystems/common/types";

const AlignedRow = (props: LayoutComponentProps) => {
  const { canvasId, children, isDropTarget, layoutId, layoutStyle } = props;

  return (
    <FlexLayout
      alignSelf="stretch"
      canvasId={canvasId}
      columnGap="4px"
      direction="row"
      isDropTarget={!!isDropTarget}
      layoutId={layoutId}
      wrap="wrap"
      {...(layoutStyle || {})}
    >
      {children}
    </FlexLayout>
  );
};

AlignedRow.type = LayoutComponentTypes.ALIGNED_ROW;

AlignedRow.addChild = (
  props: LayoutProps,
  children: WidgetLayoutProps[] | LayoutProps[],
  highlight: AnvilHighlightInfo,
): LayoutProps => {
  return addChildToLayout(props, children, highlight);
};

AlignedRow.getChildTemplate = (props: LayoutProps): LayoutProps | undefined => {
  if (!props) return;
  const { childTemplate } = props;
  if (childTemplate) return childTemplate;
  return;
};

AlignedRow.deriveHighlights = (
  layoutProps: LayoutProps,
  widgetPositions: WidgetPositions,
  canvasId: string,
  draggedWidgets: DraggedWidget[],
  layoutOrder?: string[],
): AnvilHighlightInfo[] => {
  return deriveAlignedRowHighlights(
    layoutProps,
    widgetPositions,
    canvasId,
    draggedWidgets,
    layoutOrder || [],
  );
};

AlignedRow.extractChildWidgetIds = (props: LayoutProps): string[] => {
  return AlignedRow.rendersWidgets(props)
    ? extractWidgetIdsFromLayoutProps(props)
    : [];
};

AlignedRow.removeChild = (
  props: LayoutProps,
  child: WidgetLayoutProps | LayoutProps,
): LayoutProps | undefined => {
  return removeChildFromLayout(props, child);
};

AlignedRow.renderChildWidgets = (
  props: LayoutComponentProps,
): React.ReactNode => {
  return renderWidgetsInAlignedRow(props);
};

AlignedRow.rendersWidgets = (props: LayoutProps): boolean => {
  return doesLayoutRenderWidgets(props);
};

export default AlignedRow;
