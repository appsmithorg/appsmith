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

import { Icon } from "@blueprintjs/core";
import { forceOpenWidgetPanel } from "actions/widgetSidebarActions";
import classNames from "classnames";
import Centered from "components/designSystems/appsmith/CenteredWrapper";
import { layoutConfigurations } from "constants/WidgetConstants";
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
import { useDynamicAppLayout } from "utils/hooks/useDynamicAppLayout";
import useGoogleFont from "utils/hooks/useGoogleFont";
// import { noop } from "utils/AppsmithUtils";
// import useHorizontalResize from "utils/hooks/useHorizontalResize";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import Canvas from "../Canvas";

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
    if (!localStorage.getItem("verticalHighlightDropArea"))
      localStorage.setItem("verticalHighlightDropArea", "0.35");
    if (!localStorage.getItem("horizontalHighlightDropArea"))
      localStorage.setItem("horizontalHighlightDropArea", "0.2");
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
      if (isPreviewMode) {
        const ele: any = document.getElementById("canvas-viewport");
        ele.style.width = "inherit";
      }
      if (appLayout?.type === "FLUID") {
        const smallestWidth = layoutConfigurations.MOBILE.minWidth;
        // Query the element
        const ele: any = document.getElementById("canvas-viewport");
        const initialWidth = ele.offsetWidth;
        // The current position of mouse
        let x = 0;
        // let y = 0;

        // The dimension of the element
        let w = 0;
        // let h = 0;
        let events: any = [];

        // Handle the mousedown event
        // that's triggered when user drags the resizer
        const mouseDownHandler = function(e: any, rightHandle: boolean) {
          // Get the current mouse position
          x = e.clientX;
          // y = e.clientY;

          // Calculate the dimension of element
          const styles = window.getComputedStyle(ele);
          w = parseInt(styles.width, 10);
          // h = parseInt(styles.height, 10);
          const mouseMove = (e: any) => mouseMoveHandler(e, rightHandle);
          events.push(mouseMove);
          // Attach the listeners to `document`
          document.addEventListener("mousemove", mouseMove);
          document.addEventListener("mouseup", mouseUpHandler);
          // e.stopPropagation();
        };

        const mouseMoveHandler = function(e: any, rightHandle: boolean) {
          // How far the mouse has been moved
          const multiplier = rightHandle ? 2 : -2;
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

        const mouseUpHandler = function() {
          // Remove the handlers of `mousemove` and `mouseup`
          document.removeEventListener("mousemove", events[0] as any);
          document.removeEventListener("mouseup", mouseUpHandler);
          events = [];
        };
        const rightResizer: any = ele.querySelectorAll(".resizer-right")[0];
        const leftResizer: any = ele.querySelectorAll(".resizer-left")[0];
        const rightMove = (e: any) => mouseDownHandler(e, true);
        const leftMove = (e: any) => mouseDownHandler(e, false);

        rightResizer.addEventListener("mousedown", rightMove);
        leftResizer.addEventListener("mousedown", leftMove);
        return () => {
          rightResizer.removeEventListener("mousedown", rightMove);
          leftResizer.removeEventListener("mousedown", leftMove);
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
      {appPositioningType === AppPositioningTypes.AUTO && (
        <>
          <span
            className="resizer-left"
            draggable
            onDragStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            style={{
              position: "sticky",
              cursor: "col-resize",
              width: "16px",
              height: "0px",
              left: isPreviewMode ? "0px" : "16px",
              top: "50%",
              zIndex: isPreviewMode ? 2 : undefined,
              float: "left",
            }}
          >
            <Icon icon={"drawer-right-filled"} />
          </span>
          <span
            className="resizer-right"
            draggable
            onDragStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            style={{
              position: "sticky",
              cursor: "col-resize",
              width: "16px",
              height: "0px",
              right: isPreviewMode ? "0px" : "16px",
              top: "50%",
              zIndex: isPreviewMode ? 2 : undefined,
              float: "right",
            }}
          >
            <Icon icon={"drawer-left-filled"} />
          </span>
        </>
      )}
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
  );
}
CanvasContainer.whyDidYouRender = {
  logOnDifferentValues: true,
};

export default CanvasContainer;
