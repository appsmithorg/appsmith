import React from "react";
import { FlexLayout } from "./FlexLayout";
import {
  LayoutComponentTypes,
  type AnvilHighlightInfo,
  type LayoutComponentProps,
  type LayoutProps,
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

AlignedColumn.type = LayoutComponentTypes.ALIGNED_COLUMN;

AlignedColumn.addChild = (
  props: LayoutProps,
  children: string[] | LayoutProps[],
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
    layout: [[], [], []],
  };
};

AlignedColumn.deriveHighlights = () => {
  return [];
};

AlignedColumn.extractChildWidgetIds = (props: LayoutProps): string[] => {
  return AlignedColumn.rendersWidgets(props) ? (props.layout as string[]) : [];
};

AlignedColumn.removeChild = (
  props: LayoutProps,
  child: string | LayoutProps,
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
  return doesListIncludeWidgetIDs(props);
};

export default AlignedColumn;
