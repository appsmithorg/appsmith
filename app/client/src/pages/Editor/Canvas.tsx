import log from "loglevel";
import React, { useCallback } from "react";
import styled from "styled-components";
import * as Sentry from "@sentry/react";
import { useDispatch, useSelector } from "react-redux";
import type { CanvasWidgetStructure } from "WidgetProvider/constants";
import useWidgetFocus from "utils/hooks/useWidgetFocus";
import { combinedPreviewModeSelector } from "selectors/editorSelectors";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { getViewportClassName } from "layoutSystems/autolayout/utils/AutoLayoutUtils";
import {
  APP_MAX_WIDTH,
  ThemeProvider as WDSThemeProvider,
  useTheme,
} from "@design-system/theming";
import { getIsAppSettingsPaneWithNavigationTabOpen } from "selectors/appSettingsPaneSelectors";
import { CANVAS_ART_BOARD } from "constants/componentClassNameConstants";
import { renderAppsmithCanvas } from "layoutSystems/CanvasFactory";
import type { WidgetProps } from "widgets/BaseWidget";
import { getAppThemeSettings } from "@appsmith/selectors/applicationSelectors";
import CodeModeTooltip from "pages/Editor/WidgetsEditor/components/CodeModeTooltip";
import { getIsAnvilLayout } from "layoutSystems/anvil/integrations/selectors";
import { focusWidget } from "actions/widgetActions";

interface CanvasProps {
  widgetsStructure: CanvasWidgetStructure;
  canvasWidth: number;
  maxWidth?: APP_MAX_WIDTH;
  enableMainCanvasResizer?: boolean;
}

const StyledWDSThemeProvider = styled(WDSThemeProvider)`
  min-height: 100%;
  display: flex;
`;

const appMaxWidthToCSSValue = (maxWidth: APP_MAX_WIDTH): string => {
  switch (maxWidth) {
    case APP_MAX_WIDTH.Unlimited:
      return "auto";
    case APP_MAX_WIDTH.Large:
      return "1080px";
    case APP_MAX_WIDTH.Medium:
      return "800px";
    default: {
      const exhaustiveCheck: never = maxWidth;
      throw new Error(`Unhandled maxWidth: ${exhaustiveCheck}`);
    }
  }
};

const Wrapper = styled.section<{
  background: string;
  width: number;
  maxWidth?: APP_MAX_WIDTH;
  $enableMainCanvasResizer: boolean;
}>`
  flex: 1;
  background: ${({ background }) => background};
  width: ${({ $enableMainCanvasResizer, width }) =>
    $enableMainCanvasResizer ? `100%` : `${width}px`};
  max-width: ${({ maxWidth }) =>
    maxWidth ? `${appMaxWidthToCSSValue(maxWidth)}` : "auto"};
  margin: ${({ maxWidth }) => (maxWidth ? "0 auto" : "inherit")};
`;
const Canvas = (props: CanvasProps) => {
  const { canvasWidth, maxWidth } = props;
  const isPreviewMode = useSelector(combinedPreviewModeSelector);
  const isAppSettingsPaneWithNavigationTabOpen = useSelector(
    getIsAppSettingsPaneWithNavigationTabOpen,
  );
  const selectedTheme = useSelector(getSelectedAppTheme);
  const isAnvilLayout = useSelector(getIsAnvilLayout);

  const themeSetting = useSelector(getAppThemeSettings);
  const wdsThemeProps = {
    borderRadius: themeSetting.borderRadius,
    seedColor: themeSetting.accentColor,
    colorMode: themeSetting.colorMode.toLowerCase(),
    fontFamily: themeSetting.fontFamily,
    userSizing: themeSetting.sizing,
    userDensity: themeSetting.density,
    iconStyle: themeSetting.iconStyle.toLowerCase(),
  } as Parameters<typeof useTheme>[0];
  // in case of non-WDS theme, we will pass an empty object to useTheme hook
  // so that fixedLayout theme does not break because of calculations done in useTheme
  const { theme } = useTheme(isAnvilLayout ? wdsThemeProps : {});

  const dispatch = useDispatch();
  const unfocusAllWidgets = useCallback(() => {
    dispatch(focusWidget());
  }, [dispatch]);

  /**
   * background for canvas
   */
  let backgroundForCanvas: string;

  if (isPreviewMode || isAppSettingsPaneWithNavigationTabOpen) {
    backgroundForCanvas = "initial";
  } else {
    backgroundForCanvas = selectedTheme.properties.colors.backgroundColor;
  }

  const focusRef = useWidgetFocus();

  const marginHorizontalClass = props.enableMainCanvasResizer
    ? `mx-0`
    : `mx-auto`;
  const paddingBottomClass = props.enableMainCanvasResizer ? "" : "pb-52";

  const renderChildren = () => {
    return (
      <CodeModeTooltip>
        <Wrapper
          $enableMainCanvasResizer={!!props.enableMainCanvasResizer}
          background={isAnvilLayout ? "" : backgroundForCanvas}
          className={`relative t--canvas-artboard ${paddingBottomClass} transition-all duration-400  ${marginHorizontalClass} ${getViewportClassName(
            canvasWidth,
          )}`}
          data-testid={"t--canvas-artboard"}
          id={CANVAS_ART_BOARD}
          maxWidth={maxWidth}
          onMouseLeave={unfocusAllWidgets}
          ref={isAnvilLayout ? undefined : focusRef}
          width={canvasWidth}
        >
          {props.widgetsStructure.widgetId &&
            renderAppsmithCanvas(props.widgetsStructure as WidgetProps)}
        </Wrapper>
      </CodeModeTooltip>
    );
  };

  try {
    if (isAnvilLayout) {
      return (
        <StyledWDSThemeProvider theme={theme}>
          {renderChildren()}
        </StyledWDSThemeProvider>
      );
    }

    return renderChildren();
  } catch (error) {
    log.error("Error rendering DSL", error);
    Sentry.captureException(error);
    return null;
  }
};

export default Canvas;
