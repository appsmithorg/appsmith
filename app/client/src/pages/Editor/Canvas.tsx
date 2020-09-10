import React, { memo } from "react";
import WidgetFactory from "utils/WidgetFactory";
import { ContainerWidgetProps } from "widgets/ContainerWidget";
import PropertyPane from "pages/Editor/PropertyPane";
import ArtBoard from "pages/common/ArtBoard";

interface CanvasProps {
  dsl: ContainerWidgetProps;
}

// TODO(abhinav): get the render mode from context
const Canvas = memo((props: CanvasProps) => {
  try {
    const { widgetId } = props.dsl;
    return (
      <React.Fragment>
        <PropertyPane />
        <ArtBoard width={props.dsl.rightColumn}>
          {widgetId && WidgetFactory.createWidget(widgetId)}
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
