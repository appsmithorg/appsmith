import React, { memo } from "react";
import WidgetFactory from "utils/WidgetFactory";
import { RenderModes } from "constants/WidgetConstants";
import { ContainerWidgetProps } from "widgets/ContainerWidget";
import { WidgetProps } from "widgets/BaseWidget";
import PropertyPane from "pages/Editor/PropertyPane";
import ArtBoard from "pages/common/ArtBoard";
import log from "loglevel";
import * as Sentry from "@sentry/react";

interface CanvasProps {
  dsl: ContainerWidgetProps<WidgetProps>;
}

// TODO(abhinav): get the render mode from context
const Canvas = memo((props: CanvasProps) => {
  try {
    return (
      <>
        <PropertyPane />
        <ArtBoard
          className="t--canvas-artboard"
          data-testid="t--canvas-artboard"
          id="art-board"
          width={props.dsl.rightColumn}
        >
          {props.dsl.widgetId &&
            WidgetFactory.createWidget(props.dsl, RenderModes.CANVAS)}
        </ArtBoard>
      </>
    );
  } catch (error) {
    log.error("Error rendering DSL", error);
    Sentry.captureException(error);
    return null;
  }
});

Canvas.displayName = "Canvas";

export default Canvas;
