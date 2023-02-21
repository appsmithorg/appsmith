import log from "loglevel";
import * as Sentry from "@sentry/react";
import styled from "styled-components";
import { CanvasWidgetStructure } from "widgets/constants";
import WidgetFactory from "utils/WidgetFactory";
import React from "react";

import { RenderModes } from "constants/WidgetConstants";
import { useSelector } from "react-redux";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { getCanvasScale, previewModeSelector } from "selectors/editorSelectors";
import useWidgetFocus from "utils/hooks/useWidgetFocus";

interface CanvasProps {
  widgetsStructure: CanvasWidgetStructure;
  pageId: string;
  canvasWidth: number;
}

const Container = styled.section<{
  background: string;
  width: number;
  scale: number;
}>`
  background: ${({ background }) => background};
  width: ${(props) => props.width}px;
  transform: scale(${(props) => props.scale});
  transform-origin: 0 0;
`;

const Canvas = (props: CanvasProps) => {
  const { canvasWidth } = props;
  const isPreviewMode = useSelector(previewModeSelector);
  const selectedTheme = useSelector(getSelectedAppTheme);
  const canvasScale = useSelector(getCanvasScale);

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
        className="relative mx-auto t--canvas-artboard pb-52"
        data-testid="t--canvas-artboard"
        id="art-board"
        ref={focusRef}
        scale={canvasScale}
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
