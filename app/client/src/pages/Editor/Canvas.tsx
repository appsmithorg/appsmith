import log from "loglevel";
import React from "react";
import styled from "styled-components";
import * as Sentry from "@sentry/react";
import { useSelector } from "react-redux";
import type { CanvasWidgetStructure } from "WidgetProvider/constants";
import useWidgetFocus from "utils/hooks/useWidgetFocus";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { combinedPreviewModeSelector } from "selectors/editorSelectors";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { getViewportClassName } from "layoutSystems/autolayout/utils/AutoLayoutUtils";
import type { FontFamily } from "@design-system/theming";
import {
  ThemeProvider as WDSThemeProvider,
  useTheme,
} from "@design-system/theming";
import { getIsAppSettingsPaneWithNavigationTabOpen } from "selectors/appSettingsPaneSelectors";
import { CANVAS_ART_BOARD } from "constants/componentClassNameConstants";
import { renderAppsmithCanvas } from "layoutSystems/CanvasFactory";
import type { WidgetProps } from "widgets/BaseWidget";
import { LayoutSystemTypes } from "layoutSystems/types";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";
import { getAppThemeSettings } from "@appsmith/selectors/applicationSelectors";

interface CanvasProps {
  widgetsStructure: CanvasWidgetStructure;
  pageId: string;
  canvasWidth: number;
  enableMainCanvasResizer?: boolean;
}

const Wrapper = styled.section<{
  background: string;
  width: number;
  $enableMainCanvasResizer: boolean;
}>`
  background: ${({ background }) => background};
  width: ${({ $enableMainCanvasResizer, width }) =>
    $enableMainCanvasResizer ? `100%` : `${width}px`};
  height: 100%;
`;
const Canvas = (props: CanvasProps) => {
  const { canvasWidth } = props;
  const isPreviewMode = useSelector(combinedPreviewModeSelector);
  const isAppSettingsPaneWithNavigationTabOpen = useSelector(
    getIsAppSettingsPaneWithNavigationTabOpen,
  );
  const selectedTheme = useSelector(getSelectedAppTheme);
  const isWDSEnabled = useFeatureFlag("ab_wds_enabled");
  const layoutSystemType: LayoutSystemTypes = useSelector(getLayoutSystemType);

  const themeSetting = useSelector(getAppThemeSettings);
  const themeProps = {
    borderRadius: selectedTheme.properties.borderRadius.appBorderRadius,
    seedColor: selectedTheme.properties.colors.primaryColor,
    fontFamily: selectedTheme.properties.fontFamily.appFont as FontFamily,
  };
  const wdsThemeProps = {
    borderRadius: themeSetting.borderRadius,
    seedColor: themeSetting.accentColor,
    colorMode: themeSetting.colorMode,
    fontFamily: themeSetting.fontFamily as FontFamily,
    userSizing: themeSetting.sizing,
    userDensity: themeSetting.density,
  };
  const { theme } = useTheme(isWDSEnabled ? wdsThemeProps : themeProps);

  /**
   * background for canvas
   */
  let backgroundForCanvas;

  if (isPreviewMode || isAppSettingsPaneWithNavigationTabOpen) {
    if (isWDSEnabled) {
      backgroundForCanvas = "var(--color-bg)";
    } else {
      backgroundForCanvas = "initial";
    }
  } else {
    if (isWDSEnabled) {
      backgroundForCanvas = "var(--color-bg)";
    } else {
      backgroundForCanvas = selectedTheme.properties.colors.backgroundColor;
    }
  }

  const focusRef = useWidgetFocus();

  const marginHorizontalClass = props.enableMainCanvasResizer
    ? `mx-0`
    : `mx-auto`;
  const paddingBottomClass = props.enableMainCanvasResizer ? "" : "pb-52";
  try {
    return (
      <WDSThemeProvider theme={theme}>
        <Wrapper
          $enableMainCanvasResizer={!!props.enableMainCanvasResizer}
          background={backgroundForCanvas}
          className={`relative t--canvas-artboard ${paddingBottomClass} transition-all duration-400  ${marginHorizontalClass} ${getViewportClassName(
            canvasWidth,
          )}`}
          data-testid={"t--canvas-artboard"}
          id={CANVAS_ART_BOARD}
          ref={isWDSEnabled ? undefined : focusRef}
          width={canvasWidth}
        >
          {props.widgetsStructure.widgetId &&
            renderAppsmithCanvas({
              ...props.widgetsStructure,
              classList:
                layoutSystemType === LayoutSystemTypes.ANVIL
                  ? ["main-anvil-canvas"]
                  : [],
            } as WidgetProps)}
        </Wrapper>
      </WDSThemeProvider>
    );
  } catch (error) {
    log.error("Error rendering DSL", error);
    Sentry.captureException(error);
    return null;
  }
};

export default Canvas;
