import { CANVAS_DEFAULT_MIN_HEIGHT_PX } from "constants/AppConstants";
import { RenderModes } from "constants/WidgetConstants";
import type { CanvasProps } from "layoutSystems/fixedlayout/canvas/FixedLayoutEditorCanvas";
import React from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import ContainerComponent from "widgets/ContainerWidget/component";
import { AutoLayoutCanvasView } from "./AutoLayoutCanvasView";
import { getDirection } from "./utils";

export const AutoLayoutViewerCanvas = (props: BaseWidgetProps) => {
  const canvasProps: CanvasProps = {
    ...props,
    parentRowSpace: 1,
    parentColumnSpace: 1,
    topRow: 0,
    leftColumn: 0,
    containerStyle: "none",
    detachFromLayout: true,
    minHeight: props.minHeight || CANVAS_DEFAULT_MIN_HEIGHT_PX,
    shouldScrollContents: false,
  };
  const direction = getDirection(props.positioning);
  return (
    <ContainerComponent {...canvasProps}>
      <AutoLayoutCanvasView
        direction={direction}
        renderMode={RenderModes.PAGE}
        widgetProps={props}
      />
    </ContainerComponent>
  );
};
