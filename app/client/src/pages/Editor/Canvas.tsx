import React, { memo, useCallback } from "react";
import WidgetFactory from "utils/WidgetFactory";
import { RenderModes } from "constants/WidgetConstants";
import { ContainerWidgetProps } from "widgets/ContainerWidget";
import { WidgetProps } from "widgets/BaseWidget";
import PropertyPane from "pages/Editor/PropertyPane";
import ArtBoard from "pages/common/ArtBoard";
import log from "loglevel";
import * as Sentry from "@sentry/react";
import CanvasMultiPointerArena from "../common/CanvasMultiPointerArena";
import { throttle } from "lodash";
import { io } from "socket.io-client";
import { useParams } from "react-router";
import { ExplorerURLParams } from "./Explorer/helpers";
import {
  APP_COLLAB_EVENTS,
  NAMESPACE_COLLAB_PAGE_EDIT,
} from "constants/AppCollabConstants";

interface CanvasProps {
  dsl: ContainerWidgetProps<WidgetProps>;
}

const pageLevelSocket = io(NAMESPACE_COLLAB_PAGE_EDIT);

// TODO(abhinav): get the render mode from context
const Canvas = memo((props: CanvasProps) => {
  const { pageId } = useParams<ExplorerURLParams>();
  const shareMousePointer = (e: any) => {
    if (!!pageLevelSocket) {
      const selectionCanvas: any = document.getElementById(
        "multiplayer-canvas",
      );
      const rect = selectionCanvas.getBoundingClientRect();

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      pageLevelSocket.emit(APP_COLLAB_EVENTS.SHARE_USER_POINTER, {
        data: { x, y },
        pageId,
      });
    }
  };
  const delayedShareMousePointer = useCallback(
    throttle((e) => shareMousePointer(e), 50, { trailing: false }),
    [shareMousePointer],
  );
  try {
    return (
      <>
        <PropertyPane />
        <ArtBoard
          className="t--canvas-artboard"
          data-testid="t--canvas-artboard"
          id="art-board"
          onMouseMove={(e) => {
            e.persist();
            delayedShareMousePointer(e);
          }}
          width={props.dsl.rightColumn}
        >
          {props.dsl.widgetId &&
            WidgetFactory.createWidget(props.dsl, RenderModes.CANVAS)}
          <CanvasMultiPointerArena pageLevelSocket={pageLevelSocket} />
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
