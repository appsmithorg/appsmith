import type { ReactNode } from "react";
import React, { useEffect, useRef } from "react";
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
import { Spinner } from "@appsmith/ads";
import equal from "fast-deep-equal/es6";
import { WidgetGlobaStyles } from "globalStyles/WidgetGlobalStyles";
import { useDispatch } from "react-redux";
import {
  getAppThemeIsChanging,
  getSelectedAppTheme,
} from "selectors/appThemingSelectors";
import { getCanvasWidgetsStructure } from "ee/selectors/entitiesSelector";
import Canvas from "pages/Editor/Canvas";
import type { DefaultRootState } from "react-redux";
import { getIsAnonymousDataPopupVisible } from "selectors/onboardingSelectors";
import { MainContainerResizer } from "layoutSystems/common/mainContainerResizer/MainContainerResizer";
import { useMainContainerResizer } from "layoutSystems/common/mainContainerResizer/useMainContainerResizer";
import { getIsAnvilLayout } from "layoutSystems/anvil/integrations/selectors";
import { useCanvasWidthAutoResize } from "../../../hooks";

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
  width: 100%;
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
export function MainContainerWrapper(props: MainCanvasWrapperProps) {
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
  const selectedTheme = useSelector(getSelectedAppTheme);
  const shouldHaveTopMargin =
    !(isPreviewMode || isProtectedMode) ||
    !isAppSettingsPaneWithNavigationTabOpen ||
    pages.length > 1;
  const isAppThemeChanging = useSelector(getAppThemeIsChanging);
  const showCanvasTopSection = useSelector(showCanvasTopSectionSelector);
  const showAnonymousDataPopup = useSelector(getIsAnonymousDataPopupVisible);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const isCanvasInitialized = useCanvasWidthAutoResize({ ref: wrapperRef });
  const isPageInitializing = isFetchingPage || !isCanvasInitialized;
  const { canShowResizer, enableMainContainerResizer } =
    useMainContainerResizer();
  const isAnvilLayout = useSelector(getIsAnvilLayout);

  useEffect(() => {
    return () => {
      dispatch(forceOpenWidgetPanel(false));
    };
  }, [dispatch]);

  const fontFamily = `${selectedTheme.properties.fontFamily.appFont}, sans-serif`;
  const isAutoCanvasResizing = useSelector(
    (state: DefaultRootState) => state.ui.widgetDragResize.isAutoCanvasResizing,
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
        widgetsStructure={widgetsStructure}
      />
    );
  }

  const isPreviewingNavigation =
    isPreviewMode || isProtectedMode || isAppSettingsPaneWithNavigationTabOpen;

  return (
    <>
      <Wrapper
        $enableMainCanvasResizer={enableMainContainerResizer}
        background={
          isPreviewMode ||
          isProtectedMode ||
          isAppSettingsPaneWithNavigationTabOpen
            ? isAnvilLayout
              ? ""
              : selectedTheme.properties.colors.backgroundColor
            : "initial"
        }
        className={classNames({
          [`${getCanvasClassName()} scrollbar-thin`]: true,
          "mt-0": shouldShowSnapShotBanner || !shouldHaveTopMargin,
          "mt-4":
            !shouldShowSnapShotBanner &&
            (showCanvasTopSection || showAnonymousDataPopup) &&
            !isAnvilLayout,
          "mt-8":
            !shouldShowSnapShotBanner &&
            shouldHaveTopMargin &&
            !showCanvasTopSection &&
            !isPreviewingNavigation &&
            !showAnonymousDataPopup &&
            !isAnvilLayout,
          "mt-24": shouldShowSnapShotBanner,
        })}
        isAppSettingsPaneWithNavigationTabOpen={
          isAppSettingsPaneWithNavigationTabOpen
        }
        isPreviewingNavigation={isPreviewingNavigation}
        navigationHeight={navigationHeight}
        ref={wrapperRef}
        style={{
          height: isPreviewMode ? `calc(100% - ${navigationHeight})` : "auto",
          fontFamily: fontFamily,
          pointerEvents: isAutoCanvasResizing ? "none" : "auto",
        }}
      >
        {!isAnvilLayout && (
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
        isPageInitiated={!isPageInitializing && !!widgetsStructure}
        isPreview={isPreviewMode || isProtectedMode}
        navigationHeight={navigationHeight}
      />
    </>
  );
}
