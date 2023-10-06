import {
  LayoutComponentTypes,
  type AnvilHighlightInfo,
  type LayoutComponentProps,
  type LayoutProps,
  type WidgetLayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import React from "react";
import { FlexLayout } from "./FlexLayout";
import { doesLayoutRenderWidgets } from "layoutSystems/anvil/utils/layouts/typeUtils";
import { renderWidgets } from "layoutSystems/anvil/utils/layouts/renderUtils";
import { RenderModes } from "constants/WidgetConstants";
import {
  addChildToLayout,
  extractWidgetIdsFromLayoutProps,
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

Row.type = LayoutComponentTypes.ROW;

Row.addChild = (
  props: LayoutProps,
  children: WidgetLayoutProps[] | LayoutProps[],
  highlight: AnvilHighlightInfo,
): LayoutProps => {
  return addChildToLayout(props, children, highlight);
};

Row.getChildTemplate = (props: LayoutProps): LayoutProps | undefined => {
  if (!props) return;
  const { childTemplate } = props;
  if (childTemplate) return childTemplate;
  return;
};

Row.deriveHighlights = () => {
  return [];
};

Row.extractChildWidgetIds = (props: LayoutProps): string[] => {
  return Row.rendersWidgets(props)
    ? extractWidgetIdsFromLayoutProps(props)
    : [];
};

Row.removeChild = (
  props: LayoutProps,
  child: WidgetLayoutProps | LayoutProps,
): LayoutProps | undefined => {
  return removeChildFromLayout(props, child);
};

Row.renderChildWidgets = (props: LayoutComponentProps): React.ReactNode => {
  return renderWidgets(
    Row.extractChildWidgetIds(props),
    props.childrenMap,
    props.renderMode || RenderModes.CANVAS,
  );
};

Row.rendersWidgets = (props: LayoutProps): boolean => {
  return doesLayoutRenderWidgets(props);
};

export default Row;
