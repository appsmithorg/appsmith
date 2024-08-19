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
  ThemeProvider as WDSThemeProvider,
  useTheme,
} from "@appsmith/wds-theming";
import { getIsAppSettingsPaneWithNavigationTabOpen } from "selectors/appSettingsPaneSelectors";
import { CANVAS_ART_BOARD } from "constants/componentClassNameConstants";
import { renderAppsmithCanvas } from "layoutSystems/CanvasFactory";
import type { WidgetProps } from "widgets/BaseWidget";
import { getAppThemeSettings } from "ee/selectors/applicationSelectors";
import CodeModeTooltip from "pages/Editor/WidgetsEditor/components/CodeModeTooltip";
import { getIsAnvilLayout } from "layoutSystems/anvil/integrations/selectors";
import { focusWidget } from "actions/widgetActions";

interface CanvasProps {
  widgetsStructure: CanvasWidgetStructure;
  canvasWidth: number;
  enableMainCanvasResizer?: boolean;
}

const StyledWDSThemeProvider = styled(WDSThemeProvider)`
  min-height: 100%;
  display: flex;
`;

const Wrapper = styled.section<{
  background: string;
  width: number;
  $enableMainCanvasResizer: boolean;
}>`
  flex: 1;
  background: ${({ background }) => background};
  width: ${({ $enableMainCanvasResizer, width }) =>
    $enableMainCanvasResizer ? `100%` : `${width}px`};
`;
const Canvas = (props: CanvasProps) => {
  const { canvasWidth } = props;
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
          className={`relative t--canvas-artboard ${paddingBottomClass} ${marginHorizontalClass} ${getViewportClassName(
            canvasWidth,
          )}`}
          data-testid={"t--canvas-artboard"}
          id={CANVAS_ART_BOARD}
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
