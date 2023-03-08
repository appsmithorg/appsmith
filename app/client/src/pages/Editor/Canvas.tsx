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

interface CanvasProps {
  widgetsStructure: CanvasWidgetStructure;
  pageId: string;
  canvasWidth: number;
  isAutoLayout?: boolean;
}

const Container = styled.section<{
  background: string;
  width: number;
  $isAutoLayout: boolean;
}>`
  background: ${({ background }) => background};
  width: ${({ $isAutoLayout, width }) =>
    $isAutoLayout ? `100%` : `${width}px`};
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

  const marginHorizontalClass = props.isAutoLayout ? `mx-0` : `mx-auto`;

  try {
    return (
      <Container
        $isAutoLayout={!!props.isAutoLayout}
        background={backgroundForCanvas}
        className={`relative t--canvas-artboard pb-52 ${marginHorizontalClass}`}
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
