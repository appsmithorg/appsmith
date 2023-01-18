import * as Sentry from "@sentry/react";
import log from "loglevel";
import React, { memo, useCallback, useEffect } from "react";
import store from "store";
import styled from "styled-components";
import WidgetFactory from "utils/WidgetFactory";
import { CanvasWidgetStructure } from "widgets/constants";

import { collabShareUserPointerEvent } from "actions/appCollabActions";
import { initPageLevelSocketConnection } from "actions/websocketActions";
import { RenderModes } from "constants/WidgetConstants";
import { throttle } from "lodash";
import CanvasMultiPointerArena, {
  POINTERS_CANVAS_ID,
} from "pages/common/CanvasArenas/CanvasMultiPointerArena";
import { useDispatch, useSelector } from "react-redux";
import { getPageLevelSocketRoomId } from "sagas/WebsocketSagas/utils";
import { isMultiplayerEnabledForUser as isMultiplayerEnabledForUserSelector } from "selectors/appCollabSelectors";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { previewModeSelector } from "selectors/editorSelectors";
import { getCurrentGitBranch } from "selectors/gitSyncSelectors";
import { getIsPageLevelSocketConnected } from "selectors/websocketSelectors";
import useWidgetFocus from "utils/hooks/useWidgetFocus";
import { getViewportClassName } from "utils/autoLayout/AutoLayoutUtils";

interface CanvasProps {
  widgetsStructure: CanvasWidgetStructure;
  pageId: string;
  canvasWidth: number;
  canvasScale?: number;
}

type PointerEventDataType = {
  data: { x: number; y: number };
  user: any;
};

const Container = styled.section<{
  background: string;
}>`
  background: ${({ background }) => background};
}
`;

const getPointerData = (
  e: any,
  pageId: string,
  isWebsocketConnected: boolean,
  currentGitBranch?: string,
) => {
  if (store.getState().ui.appCollab.editors.length < 2 || !isWebsocketConnected)
    return;
  const selectionCanvas: any = document.getElementById(POINTERS_CANVAS_ID);
  const rect = selectionCanvas.getBoundingClientRect();

  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  return {
    data: { x, y },
    pageId: getPageLevelSocketRoomId(pageId, currentGitBranch),
  };
};

const useShareMousePointerEvent = () => {
  const dispatch = useDispatch();
  const isWebsocketConnected = useSelector(getIsPageLevelSocketConnected);
  useEffect(() => {
    if (!isWebsocketConnected) {
      dispatch(initPageLevelSocketConnection());
    }
  }, [isWebsocketConnected]);

  return (pointerData: PointerEventDataType) =>
    dispatch(collabShareUserPointerEvent(pointerData));
};

// TODO(abhinav): get the render mode from context
const Canvas = memo((props: CanvasProps) => {
  const { canvasScale = 1, canvasWidth, pageId } = props;
  const isPreviewMode = useSelector(previewModeSelector);
  const selectedTheme = useSelector(getSelectedAppTheme);

  const shareMousePointer = useShareMousePointerEvent();
  const isWebsocketConnected = useSelector(getIsPageLevelSocketConnected);
  const currentGitBranch = useSelector(getCurrentGitBranch);
  const isMultiplayerEnabledForUser = useSelector(
    isMultiplayerEnabledForUserSelector,
  );
  const delayedShareMousePointer = useCallback(
    throttle((data) => shareMousePointer(data), 50, {
      trailing: false,
    }),
    [shareMousePointer, pageId],
  );

  /**
   * background for canvas
   */
  let backgroundForCanvas;

  if (isPreviewMode) {
    backgroundForCanvas = "initial";
  } else {
    backgroundForCanvas = selectedTheme.properties.colors.backgroundColor;
  }

  const focusRef = useWidgetFocus();

  try {
    return (
      <Container
        background={backgroundForCanvas}
        className={`relative mx-auto t--canvas-artboard pb-52 ${getViewportClassName(
          canvasWidth,
        )}`}
        data-testid="t--canvas-artboard"
        id="art-board"
        onMouseMove={(e) => {
          if (!isMultiplayerEnabledForUser) return;
          const data = getPointerData(
            e,
            pageId,
            isWebsocketConnected,
            currentGitBranch,
          );
          !!data && delayedShareMousePointer(data);
        }}
        ref={focusRef}
        style={{
          width: canvasWidth,
          transform: `scale(${canvasScale})`,
          transformOrigin: "0 0",
        }}
      >
        {props.widgetsStructure.widgetId &&
          WidgetFactory.createWidget(
            props.widgetsStructure,
            RenderModes.CANVAS,
          )}
        {isMultiplayerEnabledForUser && (
          <CanvasMultiPointerArena pageId={pageId} />
        )}
      </Container>
    );
  } catch (error) {
    log.error("Error rendering DSL", error);
    Sentry.captureException(error);
    return null;
  }
});

Canvas.displayName = "Canvas";

export default Canvas;
