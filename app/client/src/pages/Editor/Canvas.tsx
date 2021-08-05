import React, { memo } from "react";
import WidgetFactory from "utils/WidgetFactory";
import PropertyPane from "pages/Editor/PropertyPane";
import ArtBoard from "pages/common/ArtBoard";
import log from "loglevel";
import * as Sentry from "@sentry/react";
import { ContainerWidgetProps } from "widgets/ContainerWidget/widget";
import { WidgetProps } from "widgets/BaseWidget";

interface CanvasProps {
  dsl: ContainerWidgetProps<WidgetProps>;
  width: number;
}

const Canvas = memo(
  (props: CanvasProps) => {
    try {
      return (
        <>
          <PropertyPane />
          <ArtBoard
            className="t--canvas-artboard"
            data-testid="t--canvas-artboard"
            id="art-board"
            width={props.width}
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
  },
  (prevProps, nextProps) => {
    return (
      prevProps.width === nextProps.width &&
      JSON.stringify(prevProps.dsl) === JSON.stringify(nextProps.dsl)
    );
  },
);

Canvas.displayName = "Canvas";
Canvas.whyDidYouRender = {
  logOnDifferentValues: false,
};

export default Canvas;
