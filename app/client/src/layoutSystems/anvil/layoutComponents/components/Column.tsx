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

const Column = (props: LayoutComponentProps) => {
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

Column.type = "COLUMN" as LayoutComponentType;

Column.addChild = (
  props: LayoutComponentProps,
  children: string[] | LayoutComponentProps[],
  highlight: AnvilHighlightInfo,
): LayoutComponentProps => {
  return addChildToLayout(props, children, highlight);
};

Column.getChildTemplate = (
  props: LayoutComponentProps,
): LayoutComponentProps | undefined => {
  if (!props) return;
  const { childTemplate } = props;
  if (childTemplate) return childTemplate;
  return {
    canvasId: "",
    insertChild: true,
    layoutId: "",
    layoutType: "ROW",
    layout: [],
  };
};

Column.getWidth = () => {
  return 100;
};

Column.deriveHighlights = () => {
  return [];
};

Column.extractChildWidgetIds = (props: LayoutComponentProps): string[] => {
  return Column.rendersWidgets(props) ? (props.layout as string[]) : [];
};

Column.removeChild = (
  props: LayoutComponentProps,
  child: string | LayoutComponentProps,
): LayoutComponentProps | undefined => {
  return removeChildFromLayout(props, child);
};

Column.renderChildWidgets = (props: LayoutComponentProps): React.ReactNode => {
  return renderWidgets(
    Column.extractChildWidgetIds(props),
    props.childrenMap,
    props.renderMode || RenderModes.CANVAS,
  );
};

Column.rendersWidgets = (props: LayoutComponentProps): boolean => {
  return doesListIncludeWidgetIDs(props);
};

export default Column;
