import React, { memo } from "react";
import WidgetFactory from "utils/WidgetFactory";
import PropertyPane from "pages/Editor/PropertyPane";
import ArtBoard from "pages/common/ArtBoard";
import { DataTreeWidget } from "../../entities/DataTree/dataTreeFactory";
import NewBaseWidget from "../../widgets/NewBaseWidget";

interface CanvasProps {
  dsl: DataTreeWidget;
}

// TODO(abhinav): get the render mode from context
const Canvas = memo((props: CanvasProps) => {
  try {
    const { widgetId } = props.dsl;
    return (
      <React.Fragment>
        <PropertyPane />
        <ArtBoard width={props.dsl.rightColumn}>
          <NewBaseWidget widgetId={widgetId} />
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
