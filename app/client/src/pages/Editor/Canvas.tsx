import React, { memo, useCallback } from "react";
import store from "store";
import WidgetFactory from "utils/WidgetFactory";
import PropertyPane from "pages/Editor/PropertyPane";
import ArtBoard from "pages/common/ArtBoard";
import log from "loglevel";
import * as Sentry from "@sentry/react";
import { DSLWidget } from "widgets/constants";

import CanvasMultiPointerArena, {
  POINTERS_CANVAS_ID,
} from "../common/CanvasMultiPointerArena";
import { throttle } from "lodash";
import { io } from "socket.io-client";
import {
  APP_COLLAB_EVENTS,
  NAMESPACE_COLLAB_PAGE_EDIT,
} from "constants/AppCollabConstants";
import { RenderModes } from "constants/WidgetConstants";

interface CanvasProps {
  dsl: DSLWidget;
  pageId: string;
}

// This auto connects the socket
const pageEditSocket = io(NAMESPACE_COLLAB_PAGE_EDIT);

const shareMousePointer = (e: any, pageId: string) => {
  if (store.getState().ui.appCollab.editors.length < 2) return;
  if (pageEditSocket && pageEditSocket.connected) {
    const selectionCanvas: any = document.getElementById(POINTERS_CANVAS_ID);
    const rect = selectionCanvas.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    pageEditSocket.emit(APP_COLLAB_EVENTS.SHARE_USER_POINTER, {
      data: { x, y },
      pageId,
    });
  } else {
    pageEditSocket && pageEditSocket.connect();
  }
};

// TODO(abhinav): get the render mode from context
const Canvas = memo((props: CanvasProps) => {
  const { pageId } = props;
  const delayedShareMousePointer = useCallback(
    throttle((e) => shareMousePointer(e, pageId), 50, {
      trailing: false,
    }),
    [shareMousePointer, pageId],
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
            WidgetFactory.createWidget(props.dsl, RenderModes.EDIT)}
          <CanvasMultiPointerArena
            pageEditSocket={pageEditSocket}
            pageId={pageId}
          />
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
