import { ReactComponent as CanvasResizerIcon } from "assets/icons/ads/app-icons/canvas-resizer.svg";
import { layoutConfigurations } from "constants/WidgetConstants";
import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import {
  getCurrentApplicationLayout,
  getCurrentAppPositioningType,
  getCurrentPageId,
  previewModeSelector,
} from "selectors/editorSelectors";
import { setAutoCanvasResizing } from "actions/autoLayoutActions";
import styled from "styled-components";
import { AUTOLAYOUT_RESIZER_WIDTH_BUFFER } from "utils/hooks/useDynamicAppLayout";

const AutoLayoutCanvasResizer = styled.div`
  position: sticky;
  cursor: col-resize;
  width: 2px;
  height: 100%;
  display: flex;
  background: #d9d9d9;
  align-items: center;
  justify-content: flex-start;
  margin-left: 2px;
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
export function CanvasResizer({
  heightWithTopMargin,
  isPageInitiated,
  resizerTop,
  shouldHaveTopMargin,
}: {
  heightWithTopMargin: string;
  isPageInitiated: boolean;
  resizerTop: string;
  shouldHaveTopMargin: boolean;
}) {
  const isPreviewMode = useSelector(previewModeSelector);
  const currentPageId = useSelector(getCurrentPageId);
  const appLayout = useSelector(getCurrentApplicationLayout);
  const appPositioningType = useSelector(getCurrentAppPositioningType);
  const ref = useRef(null);
  const dispatch = useDispatch();
  useEffect(() => {
    const ele: any = document.getElementById("canvas-viewport");

    if (isPageInitiated && appPositioningType === AppPositioningTypes.AUTO) {
      const buffer = isPreviewMode ? AUTOLAYOUT_RESIZER_WIDTH_BUFFER : 0;
      const fullWidthCSS = `calc(100% - ${AUTOLAYOUT_RESIZER_WIDTH_BUFFER}px)`;
      const wrapperElement: any = document.getElementById("widgets-editor");

      let maxWidth =
        wrapperElement.offsetWidth - AUTOLAYOUT_RESIZER_WIDTH_BUFFER;

      if (ele && ele.offsetWidth >= maxWidth) {
        ele.style.width = fullWidthCSS;
      }

      if (appLayout?.type === "FLUID") {
        const smallestWidth = layoutConfigurations.MOBILE.minWidth;
        // The current position of mouse
        let x = 0;
        // let y = 0;

        // The dimension of the element
        let w = 0;
        // let h = 0;
        let events: any = [];

        // Handle the mousedown event
        // that's triggered when user drags the resizer
        const mouseDownHandler = function (e: any) {
          maxWidth =
            wrapperElement.offsetWidth - AUTOLAYOUT_RESIZER_WIDTH_BUFFER;
          // Get the current mouse position
          x = e.clientX;
          // y = e.clientY;

          // Calculate the dimension of element
          const styles = window.getComputedStyle(ele);
          dispatch(setAutoCanvasResizing(true));
          w = parseInt(styles.width, 10) + buffer;
          // h = parseInt(styles.height, 10);
          const mouseMove = (e: any) => mouseMoveHandler(e);
          events.push(mouseMove);
          // Attach the listeners to `document`
          document.addEventListener("mousemove", mouseMove);
          document.addEventListener("mouseup", mouseUpHandler);
          // e.stopPropagation();
        };

        const mouseMoveHandler = function (e: any) {
          // How far the mouse has been moved
          // const multiplier = rightHandle ? 2 : -2;
          const multiplier = 2;
          const dx = (e.clientX - x) * multiplier;
          if (maxWidth >= w + dx && smallestWidth <= w + dx) {
            // Adjust the dimension of element
            ele.style.width = `${w + dx}px`;
          }
          if (maxWidth < w + dx) {
            ele.style.width = fullWidthCSS;
          }
          if (smallestWidth > w + dx) {
            ele.style.width = `${smallestWidth}px`;
          }
          // e.stopPropagation();
        };

        const mouseUpHandler = function (e: any) {
          // Remove the handlers of `mousemove` and `mouseup`
          mouseMoveHandler(e);
          dispatch(setAutoCanvasResizing(false));
          document.removeEventListener("mousemove", events[0] as any);
          document.removeEventListener("mouseup", mouseUpHandler);
          events = [];
        };
        const rightResizer: any = ref.current;
        const rightMove = (e: any) => mouseDownHandler(e);
        rightResizer && rightResizer.addEventListener("mousedown", rightMove);

        return () => {
          rightResizer &&
            rightResizer.removeEventListener("mousedown", rightMove);
        };
      }
    } else {
      ele.style.removeProperty("width");
    }
  }, [
    appLayout,
    isPreviewMode,
    currentPageId,
    appPositioningType,
    isPageInitiated,
  ]);
  return appPositioningType === AppPositioningTypes.AUTO ? (
    <AutoLayoutCanvasResizer
      className="resizer-right"
      draggable
      onDragStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      ref={ref}
      style={{
        top: resizerTop,
        height: shouldHaveTopMargin ? heightWithTopMargin : "100vh",
        bottom: isPreviewMode ? "-3px" : "0%",
      }}
    >
      <div className="canvas-resizer-icon">
        <CanvasResizerIcon />
      </div>
    </AutoLayoutCanvasResizer>
  ) : null;
}
