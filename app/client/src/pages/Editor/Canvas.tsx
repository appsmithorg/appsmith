import React, { memo } from "react";
import WidgetFactory from "utils/WidgetFactory";
import PropertyPane from "pages/Editor/PropertyPane";
import ArtBoard from "pages/common/ArtBoard";
import log from "loglevel";
import * as Sentry from "@sentry/react";
import { DSLWidget } from "widgets/constants";

interface CanvasProps {
  dsl: DSLWidget;
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
          {props.dsl.widgetId && WidgetFactory.createWidget(props.dsl)}
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
