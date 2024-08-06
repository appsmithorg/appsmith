import type { AppState } from "ee/reducers";
import {
  selectAllWidgetsInAreaAction,
  setCanvasSelectionStateAction,
} from "actions/canvasSelectionActions";
import {
  getSlidingArenaName,
  getStickyCanvasName,
} from "constants/componentClassNameConstants";
import { theme } from "constants/DefaultTheme";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { APP_MODE } from "entities/App";
import { throttle } from "lodash";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getWidget } from "sagas/selectors";
import { getAppMode } from "ee/selectors/applicationSelectors";
import { getIsAppSettingsPaneWithNavigationTabOpen } from "selectors/appSettingsPaneSelectors";
import {
  getIsAutoLayout,
  getIsDraggingForSelection,
} from "selectors/canvasSelectors";
import {
  combinedPreviewModeSelector,
  getCurrentApplicationLayout,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { getNearestParentCanvas } from "utils/generators";
import { getAbsolutePixels } from "utils/helpers";
import type { XYCord } from "layoutSystems/common/canvasArenas/ArenaTypes";
import { useCanvasDragToScroll } from "layoutSystems/common/canvasArenas/useCanvasDragToScroll";
import { StickyCanvasArena } from "layoutSystems/common/canvasArenas/StickyCanvasArena";
import { getWidgetSelectionBlock } from "../../../../selectors/ui";

export interface SelectedArenaDimensions {
  top: number;
  left: number;
  width: number;
  height: number;
}
export function CanvasSelectionArena({
  canExtend,
  dropDisabled,
  parentId,
  snapColumnSpace,
  snapRows,
  snapRowSpace,
  widgetId,
}: {
  canExtend: boolean;
  dropDisabled: boolean;
  parentId?: string;
  snapColumnSpace: number;
  widgetId: string;
  snapRows: number;
  snapRowSpace: number;
}) {
  const dispatch = useDispatch();
  const isAutoLayout = useSelector(getIsAutoLayout);
  const canvasPadding =
    !isAutoLayout && widgetId === MAIN_CONTAINER_WIDGET_ID
      ? theme.canvasBottomPadding
      : 0;
  const slidingArenaRef = React.useRef<HTMLDivElement>(null);
  const stickyCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const parentWidget = useSelector((state: AppState) =>
    getWidget(state, parentId || ""),
  );
  const isDraggableParent = !(
    widgetId === MAIN_CONTAINER_WIDGET_ID ||
    (parentWidget && parentWidget.detachFromLayout)
  );
  const appMode = useSelector(getAppMode);
  const isPreviewMode = useSelector(combinedPreviewModeSelector);
  const isWidgetSelectionBlocked = useSelector(getWidgetSelectionBlock);
  const isAppSettingsPaneWithNavigationTabOpen = useSelector(
    getIsAppSettingsPaneWithNavigationTabOpen,
  );
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );
  const mainContainer = useSelector((state: AppState) =>
    getWidget(state, widgetId),
  );
  const currentPageId = useSelector(getCurrentPageId);
  const appLayout = useSelector(getCurrentApplicationLayout);
  const throttledWidgetSelection = useCallback(
    throttle(
      (
        selectionDimensions: SelectedArenaDimensions,
        snapToNextColumn: boolean,
        snapToNextRow: boolean,
        isMultiSelect: boolean,
      ) => {
        dispatch(
          selectAllWidgetsInAreaAction(
            selectionDimensions,
            snapToNextColumn,
            snapToNextRow,
            isMultiSelect,
            {
              snapColumnSpace,
              snapRowSpace,
            },
          ),
        );
      },
      150,
      {
        leading: true,
        trailing: true,
      },
    ),
    [widgetId, snapColumnSpace, snapRowSpace],
  );
  const isDraggingForSelection = useSelector(getIsDraggingForSelection);
  const isCurrentWidgetDrawing = useSelector((state: AppState) => {
    return state.ui.canvasSelection.widgetId === widgetId;
  });
  const outOfCanvasStartPositions = useSelector((state: AppState) => {
    return state.ui.canvasSelection.outOfCanvasStartPositions;
  });
  const defaultDrawOnObj = {
    canDraw: false,
    startPoints: undefined,
  };
  const drawOnEnterObj = useRef<{
    canDraw: boolean;
    startPoints?: XYCord;
  }>(defaultDrawOnObj);

  // start main container selection from widget editor
  useEffect(() => {
    const canDrawOnEnter =
      isDraggingForSelection &&
      isCurrentWidgetDrawing &&
      !!outOfCanvasStartPositions;

    drawOnEnterObj.current = {
      canDraw: canDrawOnEnter,
      startPoints: canDrawOnEnter ? outOfCanvasStartPositions : undefined,
    };
    if (slidingArenaRef.current && stickyCanvasRef.current && canDrawOnEnter) {
      stickyCanvasRef.current.style.zIndex = "2";
      slidingArenaRef.current.style.zIndex = "2";
    }
  }, [
    isDraggingForSelection,
    isCurrentWidgetDrawing,
    outOfCanvasStartPositions,
  ]);

  const canvasRenderingDependencies = useMemo(
    () => ({
      snapRows,
      canExtend,
    }),
    [snapRows, canExtend],
  );
  useCanvasDragToScroll(
    slidingArenaRef,
    isCurrentWidgetDrawing || isResizing,
    isDraggingForSelection || isResizing,
    canvasRenderingDependencies,
  );

  useEffect(() => {
    if (
      appMode === APP_MODE.EDIT &&
      !isAutoLayout &&
      !isDragging &&
      slidingArenaRef.current &&
      stickyCanvasRef.current
    ) {
      const scrollParent: Element | null = getNearestParentCanvas(
        slidingArenaRef.current,
      );
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scrollObj: any = {};
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const canvasCtx: any = stickyCanvasRef.current.getContext("2d");
      const initRectangle = (): SelectedArenaDimensions => ({
        top: 0,
        left: 0,
        width: 0,
        height: 0,
      });
      let selectionRectangle: SelectedArenaDimensions = initRectangle();
      let isMultiSelect = false;
      let isMouseDown = false;
      let shouldStartCanvasDragging = false;

      const getSelectionDimensions = () => {
        return {
          top:
            selectionRectangle.height < 0
              ? selectionRectangle.top - Math.abs(selectionRectangle.height)
              : selectionRectangle.top,
          left:
            selectionRectangle.width < 0
              ? selectionRectangle.left - Math.abs(selectionRectangle.width)
              : selectionRectangle.left,
          width: Math.abs(selectionRectangle.width),
          height: Math.abs(selectionRectangle.height),
        };
      };

      const selectWidgetsInit = (
        selectionDimensions: SelectedArenaDimensions,
        isMultiSelect: boolean,
      ) => {
        if (
          selectionDimensions.left &&
          selectionDimensions.top &&
          selectionDimensions.width &&
          selectionDimensions.height
        ) {
          const snapToNextColumn = selectionRectangle.height < 0;
          const snapToNextRow = selectionRectangle.width < 0;
          throttledWidgetSelection(
            selectionDimensions,
            snapToNextColumn,
            snapToNextRow,
            isMultiSelect,
          );
        }
      };

      const drawRectangle = (selectionDimensions: SelectedArenaDimensions) => {
        if (stickyCanvasRef.current) {
          const strokeWidth = 1;
          const topOffset = getAbsolutePixels(
            stickyCanvasRef.current.style.top,
          );
          const leftOffset = getAbsolutePixels(
            stickyCanvasRef.current.style.left,
          );
          canvasCtx.setLineDash([5]);
          canvasCtx.strokeStyle = "rgba(125,188,255,1)";
          canvasCtx.strokeRect(
            selectionDimensions.left - strokeWidth - leftOffset,
            selectionDimensions.top - strokeWidth - topOffset,
            selectionDimensions.width + 2 * strokeWidth,
            selectionDimensions.height + 2 * strokeWidth,
          );
          canvasCtx.fillStyle = "rgb(84, 132, 236, 0.06)";
          canvasCtx.fillRect(
            selectionDimensions.left - leftOffset,
            selectionDimensions.top - topOffset,
            selectionDimensions.width,
            selectionDimensions.height,
          );
        }
      };

      const onMouseLeave = () => {
        document.body.addEventListener("mouseup", onMouseUp, false);
        document.body.addEventListener("click", onClick, false);
      };

      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const onMouseEnter = (e: any) => {
        if (
          slidingArenaRef.current &&
          !isMouseDown &&
          drawOnEnterObj?.current.canDraw
        ) {
          firstRender(e, true);
          drawOnEnterObj.current = defaultDrawOnObj;
        } else {
          document.body.removeEventListener("mouseup", onMouseUp);
          document.body.removeEventListener("click", onClick);
        }
      };

      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const onClick = (e: any) => {
        if (
          Math.abs(selectionRectangle.height) +
            Math.abs(selectionRectangle.width) >
          0
        ) {
          if (!isMouseDown) {
            // cant set this in onMouseUp coz click seems to happen after onMouseUp.
            selectionRectangle = initRectangle();
          }
          e.stopPropagation();
        }
      };

      const startPositionsForOutCanvasSelection = () => {
        const startPoints = drawOnEnterObj.current.startPoints;
        const startPositions = {
          top: 0,
          left: 0,
        };
        if (slidingArenaRef.current && startPoints) {
          const { height, left, top, width } =
            slidingArenaRef.current.getBoundingClientRect();
          const outOfMaxBounds = {
            x: startPoints.x < left + width,
            y: startPoints.y < top + height,
          };
          const outOfMinBounds = {
            x: startPoints.x > left,
            y: startPoints.y > top,
          };
          const xInRange = outOfMaxBounds.x && outOfMinBounds.x;
          const yInRange = outOfMaxBounds.y && outOfMinBounds.y;
          const bufferFromBoundary = 2;
          startPositions.left = xInRange
            ? startPoints.x - left
            : outOfMinBounds.x
              ? width - bufferFromBoundary
              : bufferFromBoundary;
          startPositions.top = yInRange
            ? startPoints.y - top
            : outOfMinBounds.y
              ? height - bufferFromBoundary
              : bufferFromBoundary;
        }
        return startPositions;
      };

      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const firstRender = (e: any, fromOuterCanvas = false) => {
        if (
          slidingArenaRef.current &&
          stickyCanvasRef.current &&
          !isMouseDown
        ) {
          isMultiSelect = e.ctrlKey || e.metaKey || e.shiftKey;
          if (fromOuterCanvas) {
            const { left, top } = startPositionsForOutCanvasSelection();
            selectionRectangle.left = left;
            selectionRectangle.top = top;
          } else {
            selectionRectangle.left =
              e.offsetX - slidingArenaRef.current.offsetLeft;
            selectionRectangle.top =
              e.offsetY - slidingArenaRef.current.offsetTop;
          }
          selectionRectangle.width = 0;
          selectionRectangle.height = 0;
          isMouseDown = true;
          shouldStartCanvasDragging = true;
          // bring the canvas to the top layer
          stickyCanvasRef.current.style.zIndex = "2";
          slidingArenaRef.current.style.zIndex = "2";
          slidingArenaRef.current.style.cursor = "default";
        }
      };

      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const onMouseDown = (e: any) => {
        const isNotRightClick = !(e.which === 3 || e.button === 2);
        if (
          isNotRightClick &&
          slidingArenaRef.current &&
          (!isDraggableParent || e.ctrlKey || e.metaKey)
        ) {
          firstRender(e);
        }
      };
      const onMouseUp = () => {
        if (isMouseDown && slidingArenaRef.current && stickyCanvasRef.current) {
          isMouseDown = false;
          canvasCtx.clearRect(
            0,
            0,
            stickyCanvasRef.current.width,
            stickyCanvasRef.current.height,
          );
          stickyCanvasRef.current.style.zIndex = "";
          slidingArenaRef.current.style.zIndex = "";
          slidingArenaRef.current.style.cursor = "";
          //moving triggering action to the end of queue,
          // to avoid selecting the widget being dragged on
          setTimeout(() => {
            dispatch(setCanvasSelectionStateAction(false, widgetId));
          }, 0);
        }
      };
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const onMouseMove = (e: any) => {
        if (isMouseDown && slidingArenaRef.current && stickyCanvasRef.current) {
          // This is to make sure we start selection only after dragging start
          // rather than mouse down
          if (shouldStartCanvasDragging) {
            dispatch(setCanvasSelectionStateAction(true, widgetId));
            shouldStartCanvasDragging = false;
          }
          selectionRectangle.width =
            e.offsetX -
            slidingArenaRef.current.offsetLeft -
            selectionRectangle.left;
          selectionRectangle.height =
            e.offsetY -
            slidingArenaRef.current.offsetTop -
            selectionRectangle.top;
          canvasCtx.clearRect(
            0,
            0,
            stickyCanvasRef.current.width,
            stickyCanvasRef.current.height,
          );
          const selectionDimensions = getSelectionDimensions();
          drawRectangle(selectionDimensions);
          selectWidgetsInit(selectionDimensions, isMultiSelect);
          scrollObj.lastMouseMoveEvent = e;
          scrollObj.lastScrollTop = scrollParent?.scrollTop;
          scrollObj.lastScrollHeight = scrollParent?.scrollHeight;
        }
      };
      const onScroll = () => {
        const { lastMouseMoveEvent, lastScrollHeight, lastScrollTop } =
          scrollObj;
        if (
          lastMouseMoveEvent &&
          Number.isInteger(lastScrollHeight) &&
          Number.isInteger(lastScrollTop) &&
          scrollParent
        ) {
          const delta =
            scrollParent?.scrollHeight +
            scrollParent?.scrollTop -
            (lastScrollHeight + lastScrollTop);
          onMouseMove({
            offsetX: lastMouseMoveEvent.offsetX,
            offsetY: lastMouseMoveEvent.offsetY + delta,
          });
        }
      };

      const addEventListeners = () => {
        slidingArenaRef.current?.addEventListener("click", onClick, false);
        slidingArenaRef.current?.addEventListener(
          "mousedown",
          onMouseDown,
          false,
        );
        slidingArenaRef.current?.addEventListener("mouseup", onMouseUp, false);
        slidingArenaRef.current?.addEventListener(
          "mousemove",
          onMouseMove,
          false,
        );
        slidingArenaRef.current?.addEventListener(
          "mouseleave",
          onMouseLeave,
          false,
        );
        slidingArenaRef.current?.addEventListener(
          "mouseenter",
          onMouseEnter,
          false,
        );
        scrollParent?.addEventListener("scroll", onScroll, false);
      };
      const removeEventListeners = () => {
        slidingArenaRef.current?.removeEventListener("mousedown", onMouseDown);
        slidingArenaRef.current?.removeEventListener("mouseup", onMouseUp);
        slidingArenaRef.current?.removeEventListener("mousemove", onMouseMove);
        slidingArenaRef.current?.removeEventListener(
          "mouseleave",
          onMouseLeave,
        );
        slidingArenaRef.current?.removeEventListener(
          "mouseenter",
          onMouseEnter,
        );
        slidingArenaRef.current?.removeEventListener("click", onClick);
        scrollParent?.removeEventListener("scroll", onScroll);
      };
      const init = () => {
        if (
          scrollParent &&
          stickyCanvasRef.current &&
          slidingArenaRef.current
        ) {
          removeEventListeners();
          addEventListeners();
        }
      };
      if (appMode === APP_MODE.EDIT) {
        init();
      }
      return () => {
        removeEventListeners();
      };
    }
  }, [
    appLayout,
    currentPageId,
    dropDisabled,
    mainContainer,
    isDragging,
    isResizing,
    snapRows,
    snapColumnSpace,
    snapRowSpace,
  ]);

  // Resizing state still shows selection arena to aid with scroll behavior
  const shouldShow =
    appMode === APP_MODE.EDIT &&
    !(
      isDragging ||
      isPreviewMode ||
      isWidgetSelectionBlocked ||
      isAppSettingsPaneWithNavigationTabOpen ||
      dropDisabled
    );

  const canvasRef = React.useRef({
    slidingArenaRef,
    stickyCanvasRef,
  });
  const canvasReRenderDependencies = useMemo(
    () => ({
      canExtend,
      snapColumnSpace,
      snapRowSpace,
      snapRows,
    }),
    [canExtend, snapColumnSpace, snapRowSpace, snapRows],
  );
  return shouldShow ? (
    <StickyCanvasArena
      canvasId={getStickyCanvasName(widgetId)}
      canvasPadding={canvasPadding}
      dependencies={canvasReRenderDependencies}
      getRelativeScrollingParent={getNearestParentCanvas}
      ref={canvasRef}
      shouldObserveIntersection={isDraggingForSelection}
      showCanvas={shouldShow}
      sliderId={getSlidingArenaName(widgetId)}
    />
  ) : null;
}
CanvasSelectionArena.displayName = "CanvasSelectionArena";
