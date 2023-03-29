import type { ReactNode } from "react";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";

import {
  getCanvasWidth,
  getCurrentPageId,
  getIsFetchingPage,
  getViewModePageList,
  showCanvasTopSectionSelector,
} from "selectors/editorSelectors";
import styled from "styled-components";
import { getCanvasClassName } from "utils/generators";

import { forceOpenWidgetPanel } from "actions/widgetSidebarActions";
import classNames from "classnames";
import Centered from "components/designSystems/appsmith/CenteredWrapper";
import { IconSize, Spinner } from "design-system-old";
import equal from "fast-deep-equal/es6";
import { WidgetGlobaStyles } from "globalStyles/WidgetGlobalStyles";
import { useDispatch } from "react-redux";
import { useParams } from "react-router";
import {
  getAppThemeIsChanging,
  getSelectedAppTheme,
} from "selectors/appThemingSelectors";
import { getIsAutoLayout } from "selectors/canvasSelectors";
import { getCanvasWidgetsStructure } from "selectors/entitiesSelector";
import { getCurrentThemeDetails } from "selectors/themeSelectors";
import {
  AUTOLAYOUT_RESIZER_WIDTH_BUFFER,
  useDynamicAppLayout,
} from "utils/hooks/useDynamicAppLayout";
import useGoogleFont from "utils/hooks/useGoogleFont";
import Canvas from "../Canvas";
import { CanvasResizer } from "widgets/CanvasResizer";

type CanvasContainerProps = {
  isPreviewMode: boolean;
  shouldShowSnapShotBanner: boolean;
  navigationHeight?: number;
  isAppSettingsPaneWithNavigationTabOpen?: boolean;
};

const Container = styled.section<{
  $isAutoLayout: boolean;
  background: string;
  isPreviewingNavigation?: boolean;
  navigationHeight?: number;
}>`
  width: ${({ $isAutoLayout }) =>
    $isAutoLayout
      ? `calc(100% - ${AUTOLAYOUT_RESIZER_WIDTH_BUFFER}px)`
      : `100%`};
  position: relative;
  overflow-x: auto;
  overflow-y: auto;
  background: ${({ background }) => background};

  ${({ isPreviewingNavigation, navigationHeight }) => {
    if (isPreviewingNavigation) {
      return `
        margin-top: ${navigationHeight}px !important;
      `;
    }
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

function CanvasContainer(props: CanvasContainerProps) {
  const { isAppSettingsPaneWithNavigationTabOpen, navigationHeight } = props;
  const dispatch = useDispatch();
  const { isPreviewMode, shouldShowSnapShotBanner } = props;

  const currentPageId = useSelector(getCurrentPageId);
  const isFetchingPage = useSelector(getIsFetchingPage);
  const canvasWidth = useSelector(getCanvasWidth);
  const isAutoLayout = useSelector(getIsAutoLayout);
  const widgetsStructure = useSelector(getCanvasWidgetsStructure, equal);
  const pages = useSelector(getViewModePageList);
  const theme = useSelector(getCurrentThemeDetails);
  const selectedTheme = useSelector(getSelectedAppTheme);
  const params = useParams<{ applicationId: string; pageId: string }>();
  const shouldHaveTopMargin =
    !isPreviewMode ||
    !isAppSettingsPaneWithNavigationTabOpen ||
    pages.length > 1;
  const isAppThemeChanging = useSelector(getAppThemeIsChanging);
  const showCanvasTopSection = useSelector(showCanvasTopSectionSelector);

  const isLayoutingInitialized = useDynamicAppLayout();
  const isPageInitializing = isFetchingPage || !isLayoutingInitialized;

  useEffect(() => {
    return () => {
      dispatch(forceOpenWidgetPanel(false));
    };
  }, []);

  const fontFamily = useGoogleFont(selectedTheme.properties.fontFamily.appFont);

  let node: ReactNode;
  const pageLoading = (
    <Centered>
      <Spinner />
    </Centered>
  );

  if (isPageInitializing) {
    node = pageLoading;
  }

  if (!isPageInitializing && widgetsStructure) {
    node = (
      <Canvas
        canvasWidth={canvasWidth}
        isAutoLayout={isAutoLayout}
        pageId={params.pageId}
        widgetsStructure={widgetsStructure}
      />
    );
  }

  const isPreviewingNavigation =
    isPreviewMode || isAppSettingsPaneWithNavigationTabOpen;

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

  const bottomBarHeight = isPreviewMode ? "0px" : theme.bottomBarHeight;
  const smallHeaderHeight = showCanvasTopSection
    ? theme.smallHeaderHeight
    : "0px";
  // calculating exact height to not allow scroll at this component,
  // calculating total height minus margin on top, top bar and bottom bar
  const heightWithTopMargin = `calc(100vh - 2rem - ${topMargin} - ${smallHeaderHeight} - ${bottomBarHeight})`;
  const resizerTop = `calc(2rem + ${topMargin} + ${smallHeaderHeight})`;
  return (
    <>
      <Container
        $isAutoLayout={isAutoLayout}
        background={
          isPreviewMode
            ? selectedTheme.properties.colors.backgroundColor
            : "initial"
        }
        className={classNames({
          [`${getCanvasClassName()} scrollbar-thin`]: true,
          "mt-0": shouldShowSnapShotBanner || !shouldHaveTopMargin,
          "mt-4": !shouldShowSnapShotBanner && showCanvasTopSection,
          "mt-8":
            !shouldShowSnapShotBanner &&
            shouldHaveTopMargin &&
            !showCanvasTopSection &&
            !isPreviewingNavigation,
          "mt-24": shouldShowSnapShotBanner,
        })}
        id={"canvas-viewport"}
        isPreviewingNavigation={isPreviewingNavigation}
        key={currentPageId}
        navigationHeight={navigationHeight}
        style={{
          height: shouldHaveTopMargin ? heightWithTopMargin : "100vh",
          fontFamily: fontFamily,
        }}
      >
        <WidgetGlobaStyles
          fontFamily={selectedTheme.properties.fontFamily.appFont}
          primaryColor={selectedTheme.properties.colors.primaryColor}
        />
        {isAppThemeChanging && (
          <div className="fixed top-0 bottom-0 left-0 right-0 flex items-center justify-center bg-white/70 z-[2]">
            <Spinner size={IconSize.XXL} />
          </div>
        )}
        {node}
      </Container>
      <CanvasResizer
        heightWithTopMargin={heightWithTopMargin}
        isPageInitiated={!isPageInitializing && !!widgetsStructure}
        resizerTop={resizerTop}
        shouldHaveTopMargin={shouldHaveTopMargin}
      />
    </>
  );
}

export default CanvasContainer;
