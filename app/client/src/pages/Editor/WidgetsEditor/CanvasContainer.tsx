import { ReactComponent as CanvasResizer } from "assets/icons/ads/app-icons/canvas-resizer.svg";
import React, { ReactNode, useEffect } from "react";
import { useSelector } from "react-redux";

import {
  getCanvasScale,
  getCanvasWidth,
  getCurrentApplicationLayout,
  getCurrentAppPositioningType,
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
import { getCanvasWidgetsStructure } from "selectors/entitiesSelector";
import { getCurrentThemeDetails } from "selectors/themeSelectors";
import {
  AUTOLAYOUT_RESIZER_WIDTH_BUFFER,
  useDynamicAppLayout,
} from "utils/hooks/useDynamicAppLayout";
import useGoogleFont from "utils/hooks/useGoogleFont";
// import { noop } from "utils/AppsmithUtils";
// import useHorizontalResize from "utils/hooks/useHorizontalResize";
import { layoutConfigurations } from "constants/WidgetConstants";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import Canvas from "../Canvas";

const AutoLayoutCanvasResizer = styled.div`
  position: sticky;
  cursor: col-resize;
  width: 2px;
  height: 100%;
  display: flex;
  background: #d9d9d9;
  align-items: center;
  justify-content: flex-start;
  z-index: 2;
  transition: width 300ms ease;
  transition: background 300ms ease;
  .canvas-resizer-icon {
    border-left: 2px solid;
    border-color: #d7d7d7;
    transition: border 300ms ease;
    margin-left: 2px;
    & > svg {
      fill: #d7d7d7;
      transition: fill 300ms ease;
    }
  }
  &:hover,
  &:active {
    width: 3px;
    transition: width 300ms ease;
    background: #ff9b4e;
    transition: background 300ms ease;
    .canvas-resizer-icon {
      border-color: #ff9b4e;
      transition: border 300ms ease;
      & > svg {
        fill: #ff9b4e;
        transition: fill 300ms ease;
      }
    }
  }
`;
const Container = styled.section<{
  background: string;
}>`
  width: 100%;
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
  const widgetsStructure = useSelector(getCanvasWidgetsStructure, equal);
  const pages = useSelector(getViewModePageList);
  const theme = useSelector(getCurrentThemeDetails);
  const isPreviewMode = useSelector(previewModeSelector);
  const selectedTheme = useSelector(getSelectedAppTheme);
  const params = useParams<{ applicationId: string; pageId: string }>();
  const shouldHaveTopMargin = !isPreviewMode || pages.length > 1;
  const isAppThemeChanging = useSelector(getAppThemeIsChanging);
  const showCanvasTopSection = useSelector(showCanvasTopSectionSelector);
  const canvasScale = useSelector(getCanvasScale);

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
        canvasScale={canvasScale}
        canvasWidth={canvasWidth}
        pageId={params.pageId}
        widgetsStructure={widgetsStructure}
      />
    );
  }
  const appPositioningType = useSelector(getCurrentAppPositioningType);
  const appLayout = useSelector(getCurrentApplicationLayout);
  useEffect(() => {
    if (appPositioningType === AppPositioningTypes.AUTO) {
      let buffer = 0;
      if (isPreviewMode) {
        const ele: any = document.getElementById("canvas-viewport");
        ele.style.width = "inherit";
        buffer = AUTOLAYOUT_RESIZER_WIDTH_BUFFER;
      }
      if (appLayout?.type === "FLUID") {
        const smallestWidth = layoutConfigurations.MOBILE.minWidth;
        // Query the element
        const ele: any = document.getElementById("canvas-viewport");
        let needsInitiation = true;
        let initialWidth = ele.offsetWidth;
        // The current position of mouse
        let x = 0;
        // let y = 0;

        // The dimension of the element
        let w = 0;
        // let h = 0;
        let events: any = [];

        // Handle the mousedown event
        // that's triggered when user drags the resizer
        const mouseDownHandler = function(e: any) {
          if (needsInitiation) {
            initialWidth = ele.offsetWidth;
            needsInitiation = false;
          }
          // Get the current mouse position
          x = e.clientX;
          // y = e.clientY;

          // Calculate the dimension of element
          const styles = window.getComputedStyle(ele);
          w = parseInt(styles.width, 10) + buffer;
          // h = parseInt(styles.height, 10);
          const mouseMove = (e: any) => mouseMoveHandler(e);
          events.push(mouseMove);
          // Attach the listeners to `document`
          document.addEventListener("mousemove", mouseMove);
          document.addEventListener("mouseup", mouseUpHandler);
          // e.stopPropagation();
        };

        const mouseMoveHandler = function(e: any) {
          // How far the mouse has been moved
          // const multiplier = rightHandle ? 2 : -2;
          const multiplier = 2;
          const dx = (e.clientX - x) * multiplier;
          if (initialWidth >= w + dx && smallestWidth <= w + dx) {
            // Adjust the dimension of element
            ele.style.width = `${w + dx}px`;
          }
          if (initialWidth < w + dx) {
            ele.style.width = `${initialWidth}px`;
          }
          if (smallestWidth > w + dx) {
            ele.style.width = `${smallestWidth}px`;
          }
          // e.stopPropagation();
        };

        const mouseUpHandler = function(e: any) {
          // Remove the handlers of `mousemove` and `mouseup`
          mouseMoveHandler(e);
          document.removeEventListener("mousemove", events[0] as any);
          document.removeEventListener("mouseup", mouseUpHandler);
          events = [];
        };
        const rightResizer: any = ele.querySelectorAll(".resizer-right")[0];
        const rightMove = (e: any) => mouseDownHandler(e);
        rightResizer.addEventListener("mousedown", rightMove);

        return () => {
          rightResizer.removeEventListener("mousedown", rightMove);
        };
      }
    }
  }, [appLayout, isPreviewMode, currentPageId, appPositioningType]);

  // calculating exact height to not allow scroll at this component,
  // calculating total height minus margin on top, top bar and bottom bar
  const heightWithTopMargin = `calc(100vh - 2.25rem - ${theme.smallHeaderHeight} - ${theme.bottomBarHeight})`;
  return (
    <Container
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
      {appPositioningType === AppPositioningTypes.AUTO && (
        <AutoLayoutCanvasResizer
          className="resizer-right"
          draggable
          onDragStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          style={{
            left: isPreviewMode
              ? `calc(100% - ${20}px)`
              : `calc(100% - ${37}px)`,
            bottom: isPreviewMode ? "-3px" : "0%",
          }}
        >
          <div className="canvas-resizer-icon">
            <CanvasResizer />
          </div>
        </AutoLayoutCanvasResizer>
      )}
    </Container>
  );
}
CanvasContainer.whyDidYouRender = {
  logOnDifferentValues: true,
};

export default CanvasContainer;
