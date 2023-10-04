import type {
  AnvilHighlightInfo,
  LayoutComponentProps,
  LayoutComponentType,
} from "layoutSystems/anvil/utils/anvilTypes";
import React from "react";
import { FlexLayout } from "./FlexLayout";
import { doesListIncludeWidgetIDs } from "layoutSystems/anvil/utils/layouts/typeUtils";
import { renderWidgets } from "layoutSystems/anvil/utils/layouts/renderUtils";
import { RenderModes } from "constants/WidgetConstants";
import {
  addChildToLayout,
  removeChildFromLayout,
} from "layoutSystems/anvil/utils/layouts/layoutUtils";

const Row = (props: LayoutComponentProps) => {
  const { canvasId, children, layoutId, layoutStyle } = props;

  return (
    <FlexLayout
      alignSelf="stretch"
      canvasId={canvasId}
      columnGap="4px"
      direction="row"
      layoutId={layoutId}
      {...(layoutStyle || {})}
    >
      {children}
    </FlexLayout>
  );
};

Row.type = "ROW" as LayoutComponentType;

Row.addChild = (
  props: LayoutComponentProps,
  children: string[] | LayoutComponentProps[],
  highlight: AnvilHighlightInfo,
): LayoutComponentProps => {
  return addChildToLayout(props, children, highlight);
};

Row.getWidth = () => {
  return 100;
};

Row.getChildTemplate = (
  props: LayoutComponentProps,
): LayoutComponentProps | undefined => {
  if (!props) return;
  const { childTemplate } = props;
  if (childTemplate) return childTemplate;
  return;
};

Row.deriveHighlights = () => {
  return [];
};

Row.extractChildWidgetIds = (props: LayoutComponentProps): string[] => {
  return Row.rendersWidgets(props) ? (props.layout as string[]) : [];
};

Row.removeChild = (
  props: LayoutComponentProps,
  child: string | LayoutComponentProps,
): LayoutComponentProps | undefined => {
  return removeChildFromLayout(props, child);
};

Row.renderChildWidgets = (props: LayoutComponentProps): React.ReactNode => {
  return renderWidgets(
    Row.extractChildWidgetIds(props),
    props.childrenMap,
    props.renderMode || RenderModes.CANVAS,
  );
};

Row.rendersWidgets = (props: LayoutComponentProps): boolean => {
  return doesListIncludeWidgetIDs(props);
};

export default Row;
