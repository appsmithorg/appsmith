import React from "react";
import { FlexLayout } from "./FlexLayout";
import {
  LayoutComponentTypes,
  type AnvilHighlightInfo,
  type LayoutComponentProps,
  type LayoutProps,
  type WidgetLayoutProps,
  type DraggedWidget,
  type WidgetPositions,
} from "layoutSystems/anvil/utils/anvilTypes";
import { doesLayoutRenderWidgets } from "layoutSystems/anvil/utils/layouts/typeUtils";
import { renderWidgets } from "layoutSystems/anvil/utils/layouts/renderUtils";
import { RenderModes } from "constants/WidgetConstants";
import {
  addChildToLayout,
  extractWidgetIdsFromLayoutProps,
  removeChildFromLayout,
} from "layoutSystems/anvil/utils/layouts/layoutUtils";
import { deriveAlignedColumnHighlights } from "layoutSystems/anvil/utils/layouts/highlights/alignedColumnHighlights";

const AlignedColumn = (props: LayoutComponentProps) => {
  const { canvasId, children, layoutId, layoutStyle } = props;

  return (
    <FlexLayout
      canvasId={canvasId}
      direction="column"
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
  layoutOrder?: string[],
): AnvilHighlightInfo[] => {
  return deriveAlignedColumnHighlights(
    layoutProps,
    widgetPositions,
    canvasId,
    draggedWidgets,
    layoutOrder || [],
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
  return renderWidgets(
    AlignedColumn.extractChildWidgetIds(props),
    props.childrenMap,
    props.renderMode || RenderModes.CANVAS,
  );
};

AlignedColumn.rendersWidgets = (props: LayoutProps): boolean => {
  return doesLayoutRenderWidgets(props);
};

export default AlignedColumn;
