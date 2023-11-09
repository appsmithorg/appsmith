import type { ReactNode } from "react";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";

import {
  getIsFetchingPage,
  getViewModePageList,
  showCanvasTopSectionSelector,
} from "selectors/editorSelectors";
import styled from "styled-components";
import { getCanvasClassName } from "utils/generators";

import { forceOpenWidgetPanel } from "actions/widgetSidebarActions";
import classNames from "classnames";
import Centered from "components/designSystems/appsmith/CenteredWrapper";
import { Spinner } from "design-system";
import equal from "fast-deep-equal/es6";
import { WidgetGlobaStyles } from "globalStyles/WidgetGlobalStyles";
import { useDispatch } from "react-redux";
import { useParams } from "react-router";
import {
  getAppThemeIsChanging,
  getSelectedAppTheme,
} from "selectors/appThemingSelectors";
import { getCurrentThemeDetails } from "selectors/themeSelectors";
import { getCanvasWidgetsStructure } from "@appsmith/selectors/entitiesSelector";
import {
  AUTOLAYOUT_RESIZER_WIDTH_BUFFER,
  useDynamicAppLayout,
} from "utils/hooks/useDynamicAppLayout";
import Canvas from "../Canvas";
import type { AppState } from "@appsmith/reducers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { getIsAnonymousDataPopupVisible } from "selectors/onboardingSelectors";
import { CANVAS_VIEWPORT } from "constants/componentClassNameConstants";
import { MainContainerResizer } from "layoutSystems/common/mainContainerResizer/MainContainerResizer";
import { useMainContainerResizer } from "layoutSystems/common/mainContainerResizer/useMainContainerResizer";

interface MainCanvasWrapperProps {
  isPreviewMode: boolean;
  isProtectedMode: boolean;
  shouldShowSnapShotBanner: boolean;
  navigationHeight?: number;
  isAppSettingsPaneWithNavigationTabOpen?: boolean;
  currentPageId: string;
  canvasWidth: number;
}

const Wrapper = styled.section<{
  $enableMainCanvasResizer: boolean;
  background: string;
  isPreviewingNavigation?: boolean;
  isAppSettingsPaneWithNavigationTabOpen?: boolean;
  navigationHeight?: number;
}>`
  width: ${({ $enableMainCanvasResizer }) =>
    $enableMainCanvasResizer
      ? `calc(100% - ${AUTOLAYOUT_RESIZER_WIDTH_BUFFER}px)`
      : `100%`};
  position: relative;
  overflow-x: auto;
  overflow-y: auto;
  background: ${({ background }) => background};

  ${({
    isAppSettingsPaneWithNavigationTabOpen,
    isPreviewingNavigation,
    navigationHeight,
  }) => {
    let css = ``;

    if (isPreviewingNavigation) {
      css += `
        margin-top: ${navigationHeight}px !important;
      `;
    }

    if (isAppSettingsPaneWithNavigationTabOpen) {
      /**
       * We need to remove the scrollbar width to avoid small white space on the
       * right of the canvas since we disable all interactions, including scroll,
       * while the app settings pane with navigation tab is open
       */
      css += `
        ::-webkit-scrollbar {
          width: 0px;
        }
      `;
    }

    return css;
  }}

  &:before {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    pointer-events: none;
  }
`;

/**
 * OldName: CanvasContainer
 */
/**
 * This Component encompasses/wraps the center section of the editor
 * That involves mainly the main container and main container resizer
 * @param props object that contains
 * @prop isProtectedMode, boolean to indicate protected mode
 * @prop isPreviewMode, boolean to indicate preview mode
 * @prop shouldShowSnapShotBanner, boolean to indicate if snapshot is shown
 * @prop navigationHeight, height of navigation header in pixels
 * @prop isAppSettingsPaneWithNavigationTabOpen, boolean to indicate if app setting navigation ta is open
 * @prop currentPageId, current page id in string
 * @returns
 */
function MainContainerWrapper(props: MainCanvasWrapperProps) {
  const { isAppSettingsPaneWithNavigationTabOpen, navigationHeight } = props;
  const dispatch = useDispatch();
  const {
    currentPageId,
    isPreviewMode,
    isProtectedMode,
    shouldShowSnapShotBanner,
  } = props;

  const isFetchingPage = useSelector(getIsFetchingPage);
  const widgetsStructure = useSelector(getCanvasWidgetsStructure, equal);
  const pages = useSelector(getViewModePageList);
  const theme = useSelector(getCurrentThemeDetails);
  const selectedTheme = useSelector(getSelectedAppTheme);
  const params = useParams<{ applicationId: string; pageId: string }>();
  const shouldHaveTopMargin =
    !(isPreviewMode || isProtectedMode) ||
    !isAppSettingsPaneWithNavigationTabOpen ||
    pages.length > 1;
  const isAppThemeChanging = useSelector(getAppThemeIsChanging);
  const showCanvasTopSection = useSelector(showCanvasTopSectionSelector);
  const showAnonymousDataPopup = useSelector(getIsAnonymousDataPopupVisible);
  const isLayoutingInitialized = useDynamicAppLayout();
  const isPageInitializing = isFetchingPage || !isLayoutingInitialized;
  const isWDSV2Enabled = useFeatureFlag("ab_wds_enabled");
  const { canShowResizer, enableMainContainerResizer } =
    useMainContainerResizer();

  useEffect(() => {
    return () => {
      dispatch(forceOpenWidgetPanel(false));
    };
  }, []);

  const fontFamily = `${selectedTheme.properties.fontFamily.appFont}, sans-serif`;
  const isAutoCanvasResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isAutoCanvasResizing,
  );

  let node: ReactNode;
  const pageLoading = (
    <Centered>
      <Spinner size="sm" />
    </Centered>
  );

  if (isPageInitializing) {
    node = pageLoading;
  }

  if (!isPageInitializing && widgetsStructure) {
    node = (
      <Canvas
        canvasWidth={props.canvasWidth}
        enableMainCanvasResizer={enableMainContainerResizer}
        pageId={params.pageId}
        widgetsStructure={widgetsStructure}
      />
    );
  }

  const isPreviewingNavigation =
    isPreviewMode || isProtectedMode || isAppSettingsPaneWithNavigationTabOpen;

  /**
   * calculating exact height to not allow scroll at this component,
   * calculating total height of the canvas minus
   * - 1. navigation height
   *   - 1.1 height for top + stacked or top + inline nav style is calculated
   *   - 1.2 in case of sidebar nav, height is 0
   * - 2. top bar (header with preview/share/deploy buttons)
   * - 3. bottom bar (footer with debug/logs buttons)
   */
  const topMargin = shouldShowSnapShotBanner ? "4rem" : "0rem";
  const bottomBarHeight =
    isPreviewMode || isProtectedMode ? "0px" : theme.bottomBarHeight;
  const smallHeaderHeight = showCanvasTopSection
    ? theme.smallHeaderHeight
    : "0px";
  const scrollBarHeight =
    isPreviewMode || isProtectedMode || isPreviewingNavigation ? "8px" : "40px";
  // calculating exact height to not allow scroll at this component,
  // calculating total height minus margin on top, top bar and bottom bar and scrollbar height at the bottom
  const heightWithTopMargin = `calc(100vh - 2rem - ${topMargin} - ${smallHeaderHeight} - ${bottomBarHeight} - ${scrollBarHeight} - ${navigationHeight}px)`;
  return (
    <>
      <Wrapper
        $enableMainCanvasResizer={enableMainContainerResizer}
        background={
          isPreviewMode ||
          isProtectedMode ||
          isAppSettingsPaneWithNavigationTabOpen
            ? isWDSV2Enabled
              ? "var(--bg-color)"
              : selectedTheme.properties.colors.backgroundColor
            : "initial"
        }
        className={classNames({
          [`${getCanvasClassName()} scrollbar-thin`]: true,
          "mt-0": shouldShowSnapShotBanner || !shouldHaveTopMargin,
          "mt-4":
            !shouldShowSnapShotBanner &&
            (showCanvasTopSection || showAnonymousDataPopup),
          "mt-8":
            !shouldShowSnapShotBanner &&
            shouldHaveTopMargin &&
            !showCanvasTopSection &&
            !isPreviewingNavigation &&
            !showAnonymousDataPopup,
          "mt-24": shouldShowSnapShotBanner,
        })}
        id={CANVAS_VIEWPORT}
        isAppSettingsPaneWithNavigationTabOpen={
          isAppSettingsPaneWithNavigationTabOpen
        }
        isPreviewingNavigation={isPreviewingNavigation}
        key={currentPageId}
        navigationHeight={navigationHeight}
        style={{
          height: shouldHaveTopMargin ? heightWithTopMargin : "100vh",
          fontFamily: fontFamily,
          pointerEvents: isAutoCanvasResizing ? "none" : "auto",
        }}
      >
        {!isWDSV2Enabled && (
          <WidgetGlobaStyles
            fontFamily={selectedTheme.properties.fontFamily.appFont}
            primaryColor={selectedTheme.properties.colors.primaryColor}
          />
        )}
        {isAppThemeChanging && (
          <div className="fixed top-0 bottom-0 left-0 right-0 flex items-center justify-center bg-white/70 z-[2]">
            <Spinner size="md" />
          </div>
        )}
        {node}
      </Wrapper>
      <MainContainerResizer
        currentPageId={currentPageId}
        enableMainCanvasResizer={enableMainContainerResizer && canShowResizer}
        heightWithTopMargin={heightWithTopMargin}
        isPageInitiated={!isPageInitializing && !!widgetsStructure}
        isPreview={isPreviewMode || isProtectedMode}
        shouldHaveTopMargin={shouldHaveTopMargin}
      />
    </>
  );
}

export default MainContainerWrapper;
