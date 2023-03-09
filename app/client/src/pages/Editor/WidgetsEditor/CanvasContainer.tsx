import React, { ReactNode, useEffect } from "react";
import { useSelector } from "react-redux";

import {
  getCanvasWidth,
  getCurrentPageId,
  getIsFetchingPage,
  getViewModePageList,
  previewModeSelector,
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

const Container = styled.section<{
  $isAutoLayout: boolean;
  background: string;
}>`
  width: ${({ $isAutoLayout }) =>
    $isAutoLayout
      ? `calc(100% - ${AUTOLAYOUT_RESIZER_WIDTH_BUFFER}px)`
      : `100%`};
  position: relative;
  overflow-x: auto;
  overflow-y: auto;
  background: ${({ background }) => background};

  &:before {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    pointer-events: none;
  }
`;

function CanvasContainer() {
  const dispatch = useDispatch();
  const currentPageId = useSelector(getCurrentPageId);
  const isFetchingPage = useSelector(getIsFetchingPage);
  const canvasWidth = useSelector(getCanvasWidth);
  const isAutoLayout = useSelector(getIsAutoLayout);
  const widgetsStructure = useSelector(getCanvasWidgetsStructure, equal);
  const pages = useSelector(getViewModePageList);
  const theme = useSelector(getCurrentThemeDetails);
  const isPreviewMode = useSelector(previewModeSelector);
  const selectedTheme = useSelector(getSelectedAppTheme);
  const params = useParams<{ applicationId: string; pageId: string }>();
  const shouldHaveTopMargin = !isPreviewMode || pages.length > 1;
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

  // calculating exact height to not allow scroll at this component,
  // calculating total height minus margin on top, top bar and bottom bar
  const heightWithTopMargin = `calc(100vh - 2rem - ${theme.smallHeaderHeight} - ${theme.bottomBarHeight})`;
  const resizerTop = `calc(2rem + ${theme.smallHeaderHeight})`;
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
          "mt-0": !shouldHaveTopMargin,
          "mt-4": showCanvasTopSection,
          "mt-8": shouldHaveTopMargin && !showCanvasTopSection,
        })}
        id={"canvas-viewport"}
        key={currentPageId}
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
