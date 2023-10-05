import {
  LayoutComponentTypes,
  type AnvilHighlightInfo,
  type LayoutComponentProps,
  type LayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import React from "react";
import { FlexLayout } from "./FlexLayout";
import { doesAlignedRowRenderWidgets } from "layoutSystems/anvil/utils/layouts/typeUtils";
import {
  addChildToAlignedRow,
  removeChildFromAlignedRow,
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

AlignedRow.type = LayoutComponentTypes.ALIGNED_ROW;

AlignedRow.addChild = (
  props: LayoutProps,
  children: string[] | LayoutProps[],
  highlight: AnvilHighlightInfo,
): LayoutProps => {
  return addChildToAlignedRow(props, children, highlight);
};

AlignedRow.getChildTemplate = (props: LayoutProps): LayoutProps | undefined => {
  if (!props) return;
  const { childTemplate } = props;
  if (childTemplate) return childTemplate;
  return;
};

AlignedRow.deriveHighlights = () => {
  return [];
};

AlignedRow.extractChildWidgetIds = (props: LayoutProps): string[] => {
  return AlignedRow.rendersWidgets(props)
    ? (props.layout as string[][]).reduce((acc: string[], each: string[]) => {
        return acc.concat(each);
      }, [])
    : [];
};

AlignedRow.removeChild = (
  props: LayoutProps,
  child: string | LayoutProps,
): LayoutProps | undefined => {
  return removeChildFromAlignedRow(props, child as string);
};

AlignedRow.renderChildWidgets = (
  props: LayoutComponentProps,
): React.ReactNode => {
  return renderWidgetsInAlignedRow(
    props,
    AlignedRow.extractChildWidgetIds(props),
  );
};

AlignedRow.rendersWidgets = (props: LayoutProps): boolean => {
  // TODO: AlignedRow is expected to render widgets only. Shall this be hardcoded to true?
  return doesAlignedRowRenderWidgets(props);
};

export default AlignedRow;
