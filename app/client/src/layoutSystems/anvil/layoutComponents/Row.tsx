// This layout component is just created to test out the LayoutComponentHOC
// A proper implementation will be added later

import React from "react";
import type {
  LayoutComponentProps,
  LayoutComponentType,
} from "../utils/anvilTypes";
import { FlexLayout } from "./components/FlexLayout";
import { FlexLayerAlignment } from "../utils/constants";

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

Row.renderChildren = (
  props: LayoutComponentProps,
  widgetsMap: Record<string, React.ReactNode>,
) => {
  return props.layout.map((widgetId) => widgetsMap[widgetId as string]);
};

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

Row.extactChildWidgetIds = (props: LayoutComponentProps) => {
  return props.rendersWidgets ? props.layout : [];
};

export default Row;
