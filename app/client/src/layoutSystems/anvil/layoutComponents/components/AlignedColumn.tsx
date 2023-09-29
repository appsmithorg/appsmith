import React from "react";
import { FlexLayout } from "./FlexLayout";
import type {
  LayoutComponentProps,
  LayoutComponentType,
} from "layoutSystems/anvil/utils/anvilTypes";
import { doesListIncludeWidgetIDs } from "layoutSystems/anvil/utils/layouts/typeUtils";

const AlignedColumn = (props: LayoutComponentProps) => {
  const { layoutStyle } = props;

  return (
    <FlexLayout
      canvasId="test-canvas-id"
      direction="column"
      layoutId={props.layoutId}
      {...(layoutStyle || {})}
    >
      {props.children}
    </FlexLayout>
  );
};

AlignedColumn.type = "ALIGNED_COLUMN" as LayoutComponentType;

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

AlignedColumn.rendersWidgets = (props: LayoutComponentProps): boolean => {
  return doesListIncludeWidgetIDs(props);
};

export default AlignedColumn;
