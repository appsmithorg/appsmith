import * as Sentry from "@sentry/react";
import log from "loglevel";
import React from "react";
import styled from "styled-components";
import WidgetFactory from "utils/WidgetFactory";
import { CanvasWidgetStructure } from "widgets/constants";

import { RenderModes } from "constants/WidgetConstants";
import { useSelector } from "react-redux";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { previewModeSelector } from "selectors/editorSelectors";
import useWidgetFocus from "utils/hooks/useWidgetFocus";
import { getViewportClassName } from "utils/autoLayout/AutoLayoutUtils";

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

const Canvas = (props: CanvasProps) => {
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
        ref={focusRef}
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
};

export default Canvas;
