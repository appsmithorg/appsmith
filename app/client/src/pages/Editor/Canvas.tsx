import log from "loglevel";
import * as Sentry from "@sentry/react";
import styled from "styled-components";
// import store from "store";
import { CanvasWidgetStructure } from "widgets/constants";
import WidgetFactory from "utils/WidgetFactory";
import React, { memo } from "react";

// import { throttle } from "lodash";
import { RenderModes } from "constants/WidgetConstants";
import { useSelector } from "react-redux";
// import { initPageLevelSocketConnection } from "actions/websocketActions";
// import { collabShareUserPointerEvent } from "actions/appCollabActions";
// import { getIsPageLevelSocketConnected } from "selectors/websocketSelectors";
// import { getCurrentGitBranch } from "selectors/gitSyncSelectors";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
// import { getPageLevelSocketRoomId } from "sagas/WebsocketSagas/utils";
import { previewModeSelector } from "selectors/editorSelectors";

interface CanvasProps {
  widgetsStructure: CanvasWidgetStructure;
  pageId: string;
  canvasWidth: number;
}

const Container = styled.section<{
  background: string;
  width: number;
}>`
  background: ${({ background }) => background};
  width: ${(props) => props.width}px;
`;

// TODO(abhinav): get the render mode from context
const Canvas = memo((props: CanvasProps) => {
  const { canvasWidth } = props;
  const isPreviewMode = useSelector(previewModeSelector);
  const selectedTheme = useSelector(getSelectedAppTheme);

  /**
   * background for canvas
   */
  let backgroundForCanvas;

  if (isPreviewMode) {
    backgroundForCanvas = "initial";
  } else {
    backgroundForCanvas = selectedTheme.properties.colors.backgroundColor;
  }

  try {
    return (
      <Container
        background={backgroundForCanvas}
        className="relative mx-auto t--canvas-artboard pb-52"
        data-testid="t--canvas-artboard"
        id="art-board"
        width={canvasWidth}
      >
        {props.widgetsStructure.widgetId &&
          WidgetFactory.createWidget(
            props.widgetsStructure,
            RenderModes.CANVAS,
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
