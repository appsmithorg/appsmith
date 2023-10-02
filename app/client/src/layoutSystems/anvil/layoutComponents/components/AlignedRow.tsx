import type {
  LayoutComponentProps,
  LayoutComponentType,
} from "layoutSystems/anvil/utils/anvilTypes";
import React from "react";
import { FlexLayout } from "./FlexLayout";
import { doesAlignedRowRenderWidgets } from "layoutSystems/anvil/utils/layouts/typeUtils";
import type { HighlightInfo } from "layoutSystems/common/utils/types";
import {
  addChildToAlignedRow,
  removeChildFromLayout,
} from "layoutSystems/anvil/utils/layouts/layoutUtils";
import { renderWidgetsInAlignedRow } from "layoutSystems/anvil/utils/layouts/renderUtils";

const AlignedRow = (props: LayoutComponentProps) => {
  const { canvasId, children, layoutId, layoutStyle } = props;

  return (
    <FlexLayout
      alignSelf="stretch"
      canvasId={canvasId}
      columnGap="4px"
      direction="row"
      layoutId={layoutId}
      wrap="wrap"
      {...(layoutStyle || {})}
    >
      {children}
    </FlexLayout>
  );
};

AlignedRow.type = "ALIGNED_ROW" as LayoutComponentType;

AlignedRow.addChild = (
  props: LayoutComponentProps,
  children: string[] | LayoutComponentProps[],
  highlight: HighlightInfo,
): LayoutComponentProps => {
  return addChildToAlignedRow(props, children, highlight);
};

AlignedRow.getChildTemplate = (
  props: LayoutComponentProps,
): LayoutComponentProps | undefined => {
  if (!props) return;
  const { childTemplate } = props;
  if (childTemplate) return childTemplate;
  return;
};

AlignedRow.getWidth = () => {
  return 100;
};

AlignedRow.deriveHighlights = () => {
  return [];
};

AlignedRow.extractChildWidgetIds = (props: LayoutComponentProps): string[] => {
  return AlignedRow.rendersWidgets(props)
    ? (props.layout as string[][]).reduce((acc: string[], each: string[]) => {
        return acc.concat(each);
      }, [])
    : [];
};

AlignedRow.removeChild = (
  props: LayoutComponentProps,
  highlight: HighlightInfo,
): LayoutComponentProps => {
  return removeChildFromLayout(props, highlight);
};

AlignedRow.renderChildWidgets = (
  props: LayoutComponentProps,
): React.ReactNode => {
  return renderWidgetsInAlignedRow(
    props,
    AlignedRow.extractChildWidgetIds(props),
  );
};

AlignedRow.rendersWidgets = (props: LayoutComponentProps): boolean => {
  return doesAlignedRowRenderWidgets(props);
};

export default AlignedRow;
