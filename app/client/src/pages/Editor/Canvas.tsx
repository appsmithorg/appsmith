import React, { memo } from "react";
import WidgetFactory from "utils/WidgetFactory";
import { RenderModes } from "constants/WidgetConstants";
import { ContainerWidgetProps } from "widgets/ContainerWidget";
import { WidgetProps } from "widgets/BaseWidget";
import PropertyPane from "pages/Editor/PropertyPane";
import ArtBoard from "pages/common/ArtBoard";

interface CanvasProps {
  dsl: ContainerWidgetProps<WidgetProps>;
}

// TODO(abhinav): get the render mode from context
const Canvas = memo((props: CanvasProps) => {
  try {
    return (
      <React.Fragment>
        <PropertyPane />
        <ArtBoard width={props.dsl.rightColumn}>
          {props.dsl.widgetId &&
            WidgetFactory.createWidget(props.dsl, RenderModes.CANVAS)}
        </ArtBoard>
      </React.Fragment>
    );
  } catch (error) {
    console.log("Error rendering DSL", error);
    return null;
  }
});

Canvas.displayName = "Canvas";

export default Canvas;
