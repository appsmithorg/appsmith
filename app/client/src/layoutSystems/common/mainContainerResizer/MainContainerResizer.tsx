import { layoutConfigurations } from "constants/WidgetConstants";
import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentApplicationLayout } from "selectors/editorSelectors";
import { setAutoCanvasResizing } from "actions/autoLayoutActions";
import styled from "styled-components";
import { importSvg } from "@appsmith/ads-old";
import { CANVAS_VIEWPORT } from "constants/componentClassNameConstants";
import { AUTOLAYOUT_RESIZER_WIDTH_BUFFER } from "./constants";

const CanvasResizerIcon = importSvg(
  async () => import("assets/icons/ads/app-icons/canvas-resizer.svg"),
);

const AutoLayoutCanvasResizer = styled.div`
  position: relative;
  z-index: var(--on-canvas-ui-zindex);
  cursor: col-resize;
  user-select: none;
  -webkit-user-select: none;
  width: 2px;
  display: flex;
  background: var(--ads-v2-color-border);
  align-items: center;
  justify-content: flex-start;
  margin-left: 2px;
  transition: width 300ms ease;
  transition: background 300ms ease;
  .canvas-resizer-icon {
    border-left: 2px solid;
    border-color: var(--ads-v2-color-border);
    transition: border 300ms ease;
    margin-left: 2px;
    & > svg {
      fill: var(--ads-v2-color-border);
      transition: fill 300ms ease;
    }
  }
  &:hover,
  &:active {
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

/**
 * OldName: CanvasResizer
 */
export function MainContainerResizer({
  currentPageId,
  enableMainCanvasResizer,
  isPageInitiated,
  isPreview,
  navigationHeight,
}: {
  isPageInitiated: boolean;
  isPreview: boolean;
  currentPageId: string;
  enableMainCanvasResizer: boolean;
  navigationHeight?: number;
}) {
  const appLayout = useSelector(getCurrentApplicationLayout);
  const ref = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const ele: HTMLElement | null = document.getElementById(CANVAS_VIEWPORT);

    if (isPageInitiated && enableMainCanvasResizer) {
      const fullWidthCSS = `calc(100% - ${AUTOLAYOUT_RESIZER_WIDTH_BUFFER}px)`;
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

        // The dimension of the element
        let w = 0;
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let events: any = [];

        // Handle the mousedown event
        // that's triggered when user drags the resizer
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mouseDownHandler = function (e: any) {
          if (!ele || e.buttons !== 1) return;

          maxWidth =
            wrapperElement.offsetWidth - AUTOLAYOUT_RESIZER_WIDTH_BUFFER;
          // Get the current mouse position
          x = e.clientX;

          // Calculate the dimension of element
          const styles = window.getComputedStyle(ele);

          dispatch(setAutoCanvasResizing(true));
          w = parseInt(styles.width, 10);
          // h = parseInt(styles.height, 10);
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mouseMove = (e: any) => mouseMoveHandler(e);

          events.push(mouseMove);
          // Attach the listeners to `document`
          document.addEventListener("mousemove", mouseMove);
          document.addEventListener("mouseup", mouseUpHandler);
        };

        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mouseMoveHandler = function (e: any) {
          if (!ele) return;

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
        };

        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mouseUpHandler = function (e: any) {
          // Remove the handlers of `mousemove` and `mouseup`
          mouseMoveHandler(e);
          dispatch(setAutoCanvasResizing(false));
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          document.removeEventListener("mousemove", events[0]);
          document.removeEventListener("mouseup", mouseUpHandler);
          events = [];
        };
        const rightResizer = ref.current;
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rightMove = (e: any) => mouseDownHandler(e);

        rightResizer && rightResizer.addEventListener("mousedown", rightMove);

        return () => {
          rightResizer &&
            rightResizer.removeEventListener("mousedown", rightMove);
        };
      }
    } else {
      ele?.style.removeProperty("width");
    }
  }, [
    appLayout,
    isPreview,
    currentPageId,
    enableMainCanvasResizer,
    isPageInitiated,
  ]);

  return enableMainCanvasResizer ? (
    <AutoLayoutCanvasResizer
      className="resizer-right"
      draggable
      onDragStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      ref={ref}
      style={{
        top: isPreview ? navigationHeight : "0",
        height: isPreview ? `calc(100% - ${navigationHeight})` : "100%",
      }}
    >
      <div className="canvas-resizer-icon">
        <CanvasResizerIcon />
      </div>
    </AutoLayoutCanvasResizer>
  ) : null;
}
