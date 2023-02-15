import log from "loglevel";
import * as Sentry from "@sentry/react";
import styled from "styled-components";
import { CanvasWidgetStructure } from "widgets/constants";
import WidgetFactory from "utils/WidgetFactory";
import React from "react";

import { RenderModes } from "constants/WidgetConstants";
import { useSelector } from "react-redux";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { previewModeSelector } from "selectors/editorSelectors";
import useWidgetFocus from "utils/hooks/useWidgetFocus";
import classNames from "classnames";
import { getAppSettingsPaneContext } from "selectors/appSettingsPaneSelectors";
import { AppSettingsTabs } from "./AppSettingsPane/AppSettings";

interface CanvasProps {
  widgetsStructure: CanvasWidgetStructure;
  pageId: string;
  canvasWidth: number;
  canvasScale?: number;
}

const Container = styled.section<{
  background: string;
  width: number;
  $canvasScale: number;
}>`
  background: ${({ background }) => background};
  width: ${(props) => props.width}px;
  transform: scale(${(props) => props.$canvasScale});
  transform-origin: "0 0";
`;

const Canvas = (props: CanvasProps) => {
  const { canvasScale = 1, canvasWidth } = props;
  const isPreviewMode = useSelector(previewModeSelector);
  const selectedTheme = useSelector(getSelectedAppTheme);
  const appSettingsPaneContext = useSelector(getAppSettingsPaneContext);
  const isAppSettingsPaneWithNavigationTabOpen =
    AppSettingsTabs.Navigation === appSettingsPaneContext?.type;

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
        $canvasScale={canvasScale}
        background={backgroundForCanvas}
        className={classNames({
          "relative t--canvas-artboard pb-52": true,
          "mx-auto": !isAppSettingsPaneWithNavigationTabOpen,
        })}
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
