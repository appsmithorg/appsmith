import React from "react";
import { FlexLayout } from "./FlexLayout";
import type {
  LayoutComponentProps,
  LayoutComponentType,
} from "layoutSystems/anvil/utils/anvilTypes";
import { doesListIncludeWidgetIDs } from "layoutSystems/anvil/utils/layouts/typeUtils";

const Column = (props: LayoutComponentProps) => {
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

Column.type = "COLUMN" as LayoutComponentType;

Column.getWidth = () => {
  return 100;
};

Column.deriveHighlights = () => {
  return [];
};

Column.extractChildWidgetIds = (props: LayoutComponentProps): string[] => {
  return Column.rendersWidgets(props) ? (props.layout as string[]) : [];
};

Column.rendersWidgets = (props: LayoutComponentProps): boolean => {
  return doesListIncludeWidgetIDs(props);
};

export default Column;
