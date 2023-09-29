import type {
  LayoutComponentProps,
  LayoutComponentType,
} from "layoutSystems/anvil/utils/anvilTypes";
import React from "react";
import { FlexLayout } from "./FlexLayout";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import { doesListIncludeWidgetIDs } from "layoutSystems/anvil/utils/layouts/typeUtils";

const Row = (props: LayoutComponentProps) => {
  const { layoutStyle } = props;

  return (
    <FlexLayout
      canvasId="test-canvas-id"
      direction="row"
      layoutId={props.layoutId}
      {...(layoutStyle || {})}
    >
      {props.children}
    </FlexLayout>
  );
};

Row.type = "ROW" as LayoutComponentType;

Row.getWidth = () => {
  return 100;
};

Row.deriveHighlights = (canvasId: string) => {
  return [
    {
      isNewLayer: true,
      index: 0,
      layerIndex: 0,
      rowIndex: 0,
      alignment: FlexLayerAlignment.Start,
      posX: 4,
      posY: 4,
      width: 300,
      height: 4,
      isVertical: false,
      canvasId: canvasId,
      dropZone: {
        top: 0,
        bottom: 100,
        left: 0,
        right: 300,
      },
    },
  ];
};

Row.extractChildWidgetIds = (props: LayoutComponentProps): string[] => {
  return Row.rendersWidgets(props) ? (props.layout as string[]) : [];
};

Row.rendersWidgets = (props: LayoutComponentProps): boolean => {
  return doesListIncludeWidgetIDs(props);
};

export default Row;
