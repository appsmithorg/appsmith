import * as Sentry from "@sentry/react";
import log from "loglevel";
import React from "react";
import styled from "styled-components";
import WidgetFactory from "utils/WidgetFactory";
import type { CanvasWidgetStructure } from "widgets/constants";

import { RenderModes } from "constants/WidgetConstants";
import { useSelector } from "react-redux";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { previewModeSelector } from "selectors/editorSelectors";
import useWidgetFocus from "utils/hooks/useWidgetFocus";
import { getViewportClassName } from "utils/autoLayout/AutoLayoutUtils";
import { getIsAppSettingsPaneWithNavigationTabOpen } from "selectors/appSettingsPaneSelectors";

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
  const isAppSettingsPaneWithNavigationTabOpen = useSelector(
    getIsAppSettingsPaneWithNavigationTabOpen,
  );
  const selectedTheme = useSelector(getSelectedAppTheme);

  /**
   * background for canvas
   */
  let backgroundForCanvas;

  if (isPreviewMode || isAppSettingsPaneWithNavigationTabOpen) {
    backgroundForCanvas = "initial";
  } else {
    backgroundForCanvas = selectedTheme.properties.colors.backgroundColor;
  }

  const focusRef = useWidgetFocus();

  const marginHorizontalClass = props.isAutoLayout ? `mx-0` : `mx-auto`;
  const paddingBottomClass = props.isAutoLayout ? "" : "pb-52";
  try {
    return (
      <Container
        $isAutoLayout={!!props.isAutoLayout}
        background={backgroundForCanvas}
        className={`relative t--canvas-artboard ${paddingBottomClass} ${marginHorizontalClass} ${getViewportClassName(
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
