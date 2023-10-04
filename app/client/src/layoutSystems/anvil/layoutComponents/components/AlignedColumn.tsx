import React from "react";
import { FlexLayout } from "./FlexLayout";
import type {
  AnvilHighlightInfo,
  LayoutComponentProps,
  LayoutComponentType,
} from "layoutSystems/anvil/utils/anvilTypes";
import { doesListIncludeWidgetIDs } from "layoutSystems/anvil/utils/layouts/typeUtils";
import { renderWidgets } from "layoutSystems/anvil/utils/layouts/renderUtils";
import { RenderModes } from "constants/WidgetConstants";
import {
  addChildToLayout,
  removeChildFromLayout,
} from "layoutSystems/anvil/utils/layouts/layoutUtils";

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

AlignedColumn.type = "ALIGNED_COLUMN" as LayoutComponentType;

AlignedColumn.addChild = (
  props: LayoutComponentProps,
  children: string[] | LayoutComponentProps[],
  highlight: AnvilHighlightInfo,
): LayoutComponentProps => {
  return addChildToLayout(props, children, highlight);
};

AlignedColumn.getChildTemplate = (
  props: LayoutComponentProps,
): LayoutComponentProps | undefined => {
  if (!props) return;
  const { canvasId, childTemplate } = props;
  if (childTemplate) return childTemplate;
  return {
    canvasId: canvasId,
    insertChild: true,
    layoutId: "",
    layoutType: "ALIGNED_ROW",
    layout: [[], [], []],
  };
};

AlignedColumn.getWidth = () => {
  return 100;
};

AlignedColumn.deriveHighlights = () => {
  return [];
};

AlignedColumn.extractChildWidgetIds = (
  props: LayoutComponentProps,
): string[] => {
  return AlignedColumn.rendersWidgets(props) ? (props.layout as string[]) : [];
};

AlignedColumn.removeChild = (
  props: LayoutComponentProps,
  child: string | LayoutComponentProps,
): LayoutComponentProps | undefined => {
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

AlignedColumn.rendersWidgets = (props: LayoutComponentProps): boolean => {
  return doesListIncludeWidgetIDs(props);
};

export default AlignedColumn;
