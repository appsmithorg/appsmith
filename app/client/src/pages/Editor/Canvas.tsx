import log from "loglevel";
import React from "react";
import styled from "styled-components";
import * as Sentry from "@sentry/react";
import { useSelector } from "react-redux";
import WidgetFactory from "utils/WidgetFactory";
import type { CanvasWidgetStructure } from "widgets/constants";

import { RenderModes } from "constants/WidgetConstants";
import useWidgetFocus from "utils/hooks/useWidgetFocus";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { previewModeSelector } from "selectors/editorSelectors";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { getViewportClassName } from "layoutSystems/autoLayout/utils/AutoLayoutUtils";
import {
  ThemeProvider as WDSThemeProvider,
  useTheme,
} from "@design-system/theming";
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
  const isWDSV2Enabled = useFeatureFlag("ab_wds_enabled");
  const { theme } = useTheme({
    borderRadius: selectedTheme.properties.borderRadius.appBorderRadius,
    seedColor: selectedTheme.properties.colors.primaryColor,
  });

  /**
   * background for canvas
   */
  let backgroundForCanvas;

  if (isPreviewMode || isAppSettingsPaneWithNavigationTabOpen) {
    if (isWDSV2Enabled) {
      backgroundForCanvas = "var(--color-bg)";
    } else {
      backgroundForCanvas = "initial";
    }
  } else {
    if (isWDSV2Enabled) {
      backgroundForCanvas = "var(--color-bg)";
    } else {
      backgroundForCanvas = selectedTheme.properties.colors.backgroundColor;
    }
  }

  const focusRef = useWidgetFocus();

  const marginHorizontalClass = props.isAutoLayout ? `mx-0` : `mx-auto`;
  const paddingBottomClass = props.isAutoLayout ? "" : "pb-52";
  try {
    return (
      <WDSThemeProvider theme={theme}>
        <Container
          $isAutoLayout={!!props.isAutoLayout}
          background={backgroundForCanvas}
          className={`relative t--canvas-artboard ${paddingBottomClass} transition-all duration-400  ${marginHorizontalClass} ${getViewportClassName(
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
      </WDSThemeProvider>
    );
  } catch (error) {
    log.error("Error rendering DSL", error);
    Sentry.captureException(error);
    return null;
  }
};

export default Canvas;
