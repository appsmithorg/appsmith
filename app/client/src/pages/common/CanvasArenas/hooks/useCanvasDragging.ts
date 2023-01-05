import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import { OccupiedSpace } from "constants/CanvasEditorConstants";
import {
  CONTAINER_GRID_PADDING,
  GridDefaults,
} from "constants/WidgetConstants";
import { debounce, isEmpty, throttle } from "lodash";
import { CanvasDraggingArenaProps } from "pages/common/CanvasArenas/CanvasDraggingArena";
import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  MovementLimitMap,
  ReflowDirection,
  ReflowedSpaceMap,
} from "reflow/reflowTypes";
import { getZoomLevel } from "selectors/editorSelectors";
import { getNearestParentCanvas } from "utils/generators";
import { getAbsolutePixels } from "utils/helpers";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";
import { ReflowInterface, useReflow } from "utils/hooks/useReflow";
import {
  getDraggingSpacesFromBlocks,
  getDropZoneOffsets,
  getMousePositionsOnCanvas,
  noCollision,
} from "utils/WidgetPropsUtils";
import ContainerJumpMetrics from "./ContainerJumpMetric";
import {
  HighlightInfo,
  useAutoLayoutHighlights,
} from "./useAutoLayoutHighlights";
import {
  useBlocksToBeDraggedOnCanvas,
  WidgetDraggingBlock,
} from "./useBlocksToBeDraggedOnCanvas";
import { useCanvasDragToScroll } from "./useCanvasDragToScroll";

export interface XYCord {
  x: number;
  y: number;
}

const CONTAINER_JUMP_ACC_THRESHOLD = 8000;
const CONTAINER_JUMP_SPEED_THRESHOLD = 800;

//Since useCanvasDragging's Instance changes during container jump, metrics is stored outside
const containerJumpThresholdMetrics = new ContainerJumpMetrics<{
  speed?: number;
  acceleration?: number;
}>();

export const useCanvasDragging = (
  slidingArenaRef: React.RefObject<HTMLDivElement>,
  stickyCanvasRef: React.RefObject<HTMLCanvasElement>,
  {
    alignItems,
    canExtend,
    direction,
    dropDisabled,
    noPad,
    snapColumnSpace,
    snapRows,
    snapRowSpace,
    useAutoLayout,
    widgetId,
  }: CanvasDraggingArenaProps,
) => {
  const canvasZoomLevel = useSelector(getZoomLevel);
  const currentDirection = useRef<ReflowDirection>(ReflowDirection.UNSET);
  const { devicePixelRatio: scale = 1 } = window;
  const {
    blocksToDraw,
    defaultHandlePositions,
    draggingSpaces,
    getSnappedXY,
    isChildOfCanvas,
    isCurrentDraggedCanvas,
    isDragging,
    isNewWidget,
    isNewWidgetInitialTargetCanvas,
    isResizing,
    lastDraggedCanvas,
    logContainerJump,
    occSpaces,
    onDrop,
    parentDiff,
    relativeStartPoints,
    rowRef,
    stopReflowing,
    updateBottomRow,
    updateChildrenPositions,
    updateRelativeRows,
  } = useBlocksToBeDraggedOnCanvas({
    alignItems,
    canExtend,
    direction,
    noPad,
    snapColumnSpace,
    snapRows,
    snapRowSpace,
    useAutoLayout,
    widgetId,
  });
  const gridProps = {
    parentColumnSpace: snapColumnSpace,
    parentRowSpace: snapRowSpace,
    maxGridColumns: GridDefaults.DEFAULT_GRID_COLUMNS,
    paddingOffset: 0,
  };

  const reflow = useRef<ReflowInterface>();
  reflow.current = useReflow(draggingSpaces, widgetId || "", gridProps);

  // eslint-disable-next-line prefer-const

  const {
    calculateHighlights,
    cleanUpTempStyles,
    getDropInfo,
    highlightDropPosition,
  } = useAutoLayoutHighlights({
    blocksToDraw,
    canvasId: widgetId,
    direction,
    isCurrentDraggedCanvas,
    isDragging,
    useAutoLayout,
  });
  const dispatch = useDispatch();

  setTimeout(() => {
    calculateHighlights();
  }, 0);

  if (!isDragging || !isCurrentDraggedCanvas) {
    cleanUpTempStyles();
  }

  const {
    setDraggingCanvas,
    setDraggingNewWidget,
    setDraggingState,
  } = useWidgetDragResize();

  const mouseAttributesRef = useRef<{
    prevEvent: any;
    currentEvent: any;
    prevSpeed: number;
    prevAcceleration: number;
    maxPositiveAcc: number;
    maxNegativeAcc: number;
    maxSpeed: number;
    lastMousePositionOutsideCanvas: {
      x: number;
      y: number;
    };
  }>({
    prevSpeed: 0,
    prevAcceleration: 0,
    maxPositiveAcc: 0,
    maxNegativeAcc: 0,
    maxSpeed: 0,
    prevEvent: null,
    currentEvent: null,
    lastMousePositionOutsideCanvas: {
      x: 0,
      y: 0,
    },
  });

  const canScroll = useCanvasDragToScroll(
    slidingArenaRef,
    isCurrentDraggedCanvas,
    isDragging,
    snapRows,
    canExtend,
  );

  useEffect(() => {
    const speedCalculationInterval = setInterval(function() {
      const {
        currentEvent,
        maxNegativeAcc,
        maxPositiveAcc,
        maxSpeed,
        prevEvent,
        prevSpeed,
      } = mouseAttributesRef.current;
      if (prevEvent && currentEvent) {
        const movementX = Math.abs(currentEvent.screenX - prevEvent.screenX);
        const movementY = Math.abs(currentEvent.screenY - prevEvent.screenY);
        const movement = Math.sqrt(
          movementX * movementX + movementY * movementY,
        );

        const speed = 10 * movement; //current speed
        const acceleration = 10 * (speed - prevSpeed);
        mouseAttributesRef.current.prevAcceleration = acceleration;
        mouseAttributesRef.current.prevSpeed = speed;
        if (speed > maxSpeed) {
          mouseAttributesRef.current.maxSpeed = speed;
        }
        if (acceleration > 0 && acceleration > maxPositiveAcc) {
          mouseAttributesRef.current.maxPositiveAcc = acceleration;
        } else if (acceleration < 0 && acceleration < maxNegativeAcc) {
          mouseAttributesRef.current.maxNegativeAcc = acceleration;
        }
      }
      mouseAttributesRef.current.prevEvent = currentEvent;
    }, 100);
    const stopSpeedCalculation = () => {
      clearInterval(speedCalculationInterval);
    };
    const registerMouseMoveEvent = (e: any) => {
      mouseAttributesRef.current.currentEvent = e;
      mouseAttributesRef.current.lastMousePositionOutsideCanvas = {
        x: e.clientX,
        y: e.clientY,
      };
    };
    window.addEventListener("mousemove", registerMouseMoveEvent);
    return () => {
      stopSpeedCalculation();
      window.removeEventListener("mousemove", registerMouseMoveEvent);
    };
  }, []);

  useEffect(() => {
    if (
      slidingArenaRef.current &&
      !isResizing &&
      isDragging &&
      blocksToDraw.length > 0
    ) {
      // doing throttling coz reflow moves are also throttled and resetCanvas can be called multiple times
      const throttledStopReflowing = throttle(stopReflowing, 50);
      const scrollParent: Element | null = getNearestParentCanvas(
        slidingArenaRef.current,
      );
      // console.log(`#### init variable: ${widgetName}`);
      let canvasIsDragging = false;
      let isUpdatingRows = false;
      let currentRectanglesToDraw: WidgetDraggingBlock[] = [];
      const scrollObj: any = {};

      let currentReflowParams: {
        movementLimitMap?: MovementLimitMap;
        bottomMostRow: number;
        movementMap: ReflowedSpaceMap;
        isIdealToJumpContainer: boolean;
      } = {
        movementLimitMap: {},
        bottomMostRow: 0,
        movementMap: {},
        isIdealToJumpContainer: useAutoLayout || false,
      };
      let lastMousePosition = {
        x: 0,
        y: 0,
      };
      let lastSnappedPosition = {
        leftColumn: 0,
        topRow: 0,
      };

      const resetCanvasState = () => {
        throttledStopReflowing();
        if (stickyCanvasRef.current && slidingArenaRef.current) {
          const canvasCtx: any = stickyCanvasRef.current.getContext("2d");
          canvasCtx.clearRect(
            0,
            0,
            stickyCanvasRef.current.width,
            stickyCanvasRef.current.height,
          );
          slidingArenaRef.current.style.zIndex = "";
          // console.log(`#### reset canvas state: ${widgetName}`);
          canvasIsDragging = false;
        }
      };
      if (isDragging) {
        const startPoints = defaultHandlePositions;
        /**
         * On mouse up, calculate the top, left, bottom and right positions for each of the reflowed widgets
         */
        const onMouseUp = () => {
          if (isDragging && canvasIsDragging) {
            const { movementMap: reflowingWidgets } = currentReflowParams;
            const reflowedPositionsUpdatesWidgets: OccupiedSpace[] = occSpaces
              .filter((each) => !!reflowingWidgets[each.id])
              .map((each) => {
                const reflowedWidget = reflowingWidgets[each.id];
                if (
                  reflowedWidget.X !== undefined &&
                  (Math.abs(reflowedWidget.X) || reflowedWidget.width)
                ) {
                  // Could it be negative if the widget has been moved to the left?
                  const movement = reflowedWidget.X / snapColumnSpace;
                  const newWidth = reflowedWidget.width
                    ? reflowedWidget.width / snapColumnSpace
                    : each.right - each.left;
                  each = {
                    ...each,
                    left: each.left + movement,
                    right: each.left + movement + newWidth,
                  };
                }
                if (
                  reflowedWidget.Y !== undefined &&
                  (Math.abs(reflowedWidget.Y) || reflowedWidget.height)
                ) {
                  const movement = reflowedWidget.Y / snapRowSpace;
                  const newHeight = reflowedWidget.height
                    ? reflowedWidget.height / snapRowSpace
                    : each.bottom - each.top;
                  each = {
                    ...each,
                    top: each.top + movement,
                    bottom: each.top + movement + newHeight,
                  };
                }
                return each;
              });
            const dropInfo: HighlightInfo | undefined = getDropInfo({
              x: currentRectanglesToDraw[0].top,
              y: currentRectanglesToDraw[0].left,
            });
            if (dropInfo !== undefined && useAutoLayout) {
              updateChildrenPositions(dropInfo, currentRectanglesToDraw);
            } else
              onDrop(currentRectanglesToDraw, reflowedPositionsUpdatesWidgets);
          }
          startPoints.top = defaultHandlePositions.top;
          startPoints.left = defaultHandlePositions.left;
          resetCanvasState();

          resetDragging();
        };

        const resetDragging = () => {
          setTimeout(() => {
            if (isCurrentDraggedCanvas) {
              if (isNewWidget) {
                setDraggingNewWidget(false, undefined);
              } else {
                setDraggingState({
                  isDragging: false,
                });
              }
              setDraggingCanvas();
              dispatch({
                type: ReduxActionTypes.CLEAR_HIGHLIGHT_SELECTION,
              });
            }
          }, 0);
        };

        const onFirstMoveOnCanvas = (e: any, over = false) => {
          // console.log(`#### first move: ${widgetName}`);
          if (
            !isResizing &&
            isDragging &&
            !canvasIsDragging &&
            slidingArenaRef.current
          ) {
            if (!isNewWidget) {
              startPoints.left =
                relativeStartPoints.left || defaultHandlePositions.left;
              startPoints.top =
                relativeStartPoints.top || defaultHandlePositions.top;
            }
            if (!isCurrentDraggedCanvas || useAutoLayout) {
              //Called when canvas Changes
              const {
                acceleration,
                speed,
              } = containerJumpThresholdMetrics.getMetrics();

              logContainerJump(widgetId, speed, acceleration);
              containerJumpThresholdMetrics.clearMetrics();
              // we can just use canvasIsDragging but this is needed to render the relative DragLayerComponent
              // console.log(`#### set dragging canvas: ${widgetName}`);
              setDraggingCanvas(widgetId);
            }
            canvasIsDragging = true;
            slidingArenaRef.current.style.zIndex = "2";
            if (over) {
              lastMousePosition = {
                ...mouseAttributesRef.current.lastMousePositionOutsideCanvas,
              };
            } else {
              lastMousePosition = {
                x: e.clientX,
                y: e.clientY,
              };
            }

            onMouseMove(e, over);
          }
        };

        const canReflowForCurrentMouseMove = () => {
          const { prevAcceleration, prevSpeed } = mouseAttributesRef.current;
          const acceleration = Math.abs(prevAcceleration);
          return (
            acceleration < CONTAINER_JUMP_ACC_THRESHOLD ||
            prevSpeed < CONTAINER_JUMP_SPEED_THRESHOLD
          );
        };
        // const getFlexMouseMoveDirection = (event: any): ReflowDirection => {
        //   if (lastMousePosition) {

        //   }
        // };
        const getMouseMoveDirection = (event: any, minDelta = 0) => {
          if (lastMousePosition) {
            const deltaX = lastMousePosition.x - event.clientX,
              deltaY = lastMousePosition.y - event.clientY;
            lastMousePosition = {
              x: event.clientX,
              y: event.clientY,
            };
            if (
              deltaX === 0 &&
              ["TOP", "BOTTOM"].includes(currentDirection.current)
            ) {
              return currentDirection.current;
            }
            if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY > minDelta) {
              return ReflowDirection.TOP;
            } else if (
              Math.abs(deltaY) > Math.abs(deltaX) &&
              deltaY < -minDelta
            ) {
              return ReflowDirection.BOTTOM;
            }
            if (
              deltaY === 0 &&
              ["LEFT", "RIGHT"].includes(currentDirection.current)
            ) {
              return currentDirection.current;
            }
            if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > minDelta) {
              return ReflowDirection.LEFT;
            } else if (
              Math.abs(deltaX) > Math.abs(deltaY) &&
              deltaX < -minDelta
            ) {
              return ReflowDirection.RIGHT;
            }
          }
          return currentDirection.current;
        };
        const triggerReflow = (e: any, firstMove: boolean) => {
          const canReflowBasedOnMouseSpeed = canReflowForCurrentMouseMove();
          const isReflowing = !isEmpty(currentReflowParams.movementMap);
          const canReflow =
            !currentRectanglesToDraw[0].detachFromLayout &&
            !dropDisabled &&
            false;
          const currentBlock = currentRectanglesToDraw[0];
          const [leftColumn, topRow] = getDropZoneOffsets(
            snapColumnSpace,
            snapRowSpace,
            {
              x: currentBlock.left,
              y: currentBlock.top,
            },
            {
              x: 0,
              y: 0,
            },
          );
          const mousePosition = getMousePositionsOnCanvas(e, gridProps);
          const needsReflow = !(
            lastSnappedPosition.leftColumn === leftColumn &&
            lastSnappedPosition.topRow === topRow
          );
          lastSnappedPosition = {
            leftColumn,
            topRow,
          };
          if (canReflow && reflow.current) {
            if (needsReflow) {
              //The position array of dragging Widgets.
              const resizedPositions = getDraggingSpacesFromBlocks(
                currentRectanglesToDraw,
                snapColumnSpace,
                snapRowSpace,
              );
              currentDirection.current = getMouseMoveDirection(e);
              const immediateExitContainer = lastDraggedCanvas.current;
              if (lastDraggedCanvas.current) {
                lastDraggedCanvas.current = undefined;
              }
              currentReflowParams = reflow.current(
                resizedPositions,
                currentDirection.current,
                false,
                !canReflowBasedOnMouseSpeed,
                firstMove,
                immediateExitContainer,
                mousePosition,
              );
            }

            if (isReflowing) {
              const {
                isIdealToJumpContainer,
                movementLimitMap,
              } = currentReflowParams;

              if (isIdealToJumpContainer) {
                const {
                  prevAcceleration,
                  prevSpeed: speed,
                } = mouseAttributesRef.current;
                const acceleration = Math.abs(prevAcceleration);
                containerJumpThresholdMetrics.setMetrics({
                  speed,
                  acceleration,
                });
              }

              for (const block of currentRectanglesToDraw) {
                const isWithinParentBoundaries = noCollision(
                  { x: block.left, y: block.top },
                  snapColumnSpace,
                  snapRowSpace,
                  { x: 0, y: 0 },
                  block.columnWidth,
                  block.rowHeight,
                  block.widgetId,
                  [],
                  rowRef.current,
                  GridDefaults.DEFAULT_GRID_COLUMNS,
                  block.detachFromLayout,
                );

                let isNotReachedLimit = true;
                const currentBlockLimit =
                  movementLimitMap && movementLimitMap[block.widgetId];
                if (currentBlockLimit) {
                  isNotReachedLimit =
                    currentBlockLimit.canHorizontalMove &&
                    currentBlockLimit.canVerticalMove;
                }
                block.isNotColliding =
                  isWithinParentBoundaries && isNotReachedLimit;
              }
              const widgetIdsToExclude = currentRectanglesToDraw.map(
                (a) => a.widgetId,
              );
              const newRows = updateBottomRow(
                currentReflowParams.bottomMostRow,
                rowRef.current,
                widgetIdsToExclude,
              );
              rowRef.current = newRows ? newRows : rowRef.current;
            }
          }
        };

        const updateCurrentBlocks = (block: WidgetDraggingBlock, e: any) => {
          if (!useAutoLayout || block.type !== "SPACING_WIDGET") return block;

          const dropInfo: HighlightInfo | undefined = getDropInfo({
            x: block.top,
            y: block.left,
          });

          if (dropInfo == undefined) return block;

          const { height: layerHeight, isNewLayer } = dropInfo;

          let { columnWidth, height, left, rowHeight, top, width } = block;

          if (isNewLayer) {
            columnWidth = GridDefaults.DEFAULT_GRID_COLUMNS;
            width = columnWidth * snapColumnSpace;
            rowHeight = 4;
            height = rowHeight * snapRowSpace;
          } else {
            rowHeight = Math.floor(layerHeight / snapRowSpace);
            height = rowHeight * snapRowSpace;
            columnWidth = 4;
            width = columnWidth * snapColumnSpace;
          }
          left = e.offsetX - 20 - parentDiff.left;
          top = e.offsetY - 20 - parentDiff.top;

          return {
            ...block,
            columnWidth,
            rowHeight,
            height,
            width,
          };
        };
        const onMouseMove = (e: any, firstMove = false) => {
          if (isDragging && canvasIsDragging && slidingArenaRef.current) {
            const delta = {
              left: e.offsetX - startPoints.left - parentDiff.left,
              top: e.offsetY - startPoints.top - parentDiff.top,
            };
            // console.log("#### mouse move", delta);
            const drawingBlocks = blocksToDraw.map((each) => ({
              ...each,
              left: each.left + delta.left,
              top: each.top + delta.top,
            }));
            const newRows = updateRelativeRows(drawingBlocks, rowRef.current);
            const rowDelta = newRows ? newRows - rowRef.current : 0;
            rowRef.current = newRows ? newRows : rowRef.current;
            currentRectanglesToDraw = drawingBlocks.map((each) => {
              return {
                ...each,
                isNotColliding:
                  useAutoLayout ||
                  (!dropDisabled &&
                    noCollision(
                      { x: each.left, y: each.top },
                      snapColumnSpace,
                      snapRowSpace,
                      { x: 0, y: 0 },
                      each.columnWidth,
                      each.rowHeight,
                      each.widgetId,
                      occSpaces,
                      rowRef.current,
                      GridDefaults.DEFAULT_GRID_COLUMNS,
                      each.detachFromLayout,
                    )),
              };
            });
            if (rowDelta && slidingArenaRef.current && !useAutoLayout) {
              isUpdatingRows = true;
              canScroll.current = false;
              renderNewRows(delta);
            } else if (!isUpdatingRows) {
              currentDirection.current = getMouseMoveDirection(e);
              triggerReflow(e, firstMove);
              if (
                useAutoLayout &&
                isCurrentDraggedCanvas &&
                currentDirection.current !== ReflowDirection.UNSET
              ) {
                debounce(() => {
                  highlightDropPosition(e, currentDirection.current);
                }, 100)();
                currentRectanglesToDraw = drawingBlocks.map((each) => {
                  const block = updateCurrentBlocks(each, e);
                  return {
                    ...block,
                    isNotColliding:
                      useAutoLayout ||
                      (!dropDisabled &&
                        noCollision(
                          { x: block.left, y: block.top },
                          snapColumnSpace,
                          snapRowSpace,
                          { x: 0, y: 0 },
                          block.columnWidth,
                          block.rowHeight,
                          block.widgetId,
                          occSpaces,
                          rowRef.current,
                          GridDefaults.DEFAULT_GRID_COLUMNS,
                          block.detachFromLayout,
                        )),
                  };
                });
              }
              renderBlocks();
            }
            scrollObj.lastMouseMoveEvent = {
              offsetX: e.offsetX,
              offsetY: e.offsetY,
            };
            scrollObj.lastScrollTop = scrollParent?.scrollTop;
            scrollObj.lastScrollHeight = scrollParent?.scrollHeight;
            scrollObj.lastDeltaLeft = delta.left;
            scrollObj.lastDeltaTop = delta.top;
          } else {
            onFirstMoveOnCanvas(e);
          }
        };
        const renderNewRows = debounce((delta) => {
          isUpdatingRows = true;
          if (slidingArenaRef.current && stickyCanvasRef.current) {
            const canvasCtx: any = stickyCanvasRef.current.getContext("2d");
            currentRectanglesToDraw = blocksToDraw.map((each) => {
              return {
                ...each,
                left: each.left + delta.left,
                top: each.top + delta.top,
                isNotColliding:
                  !dropDisabled &&
                  noCollision(
                    { x: each.left + delta.left, y: each.top + delta.top },
                    snapColumnSpace,
                    snapRowSpace,
                    { x: 0, y: 0 },
                    each.columnWidth,
                    each.rowHeight,
                    each.widgetId,
                    occSpaces,
                    rowRef.current,
                    GridDefaults.DEFAULT_GRID_COLUMNS,
                    each.detachFromLayout,
                  ),
              };
            });
            canvasCtx.save();
            canvasCtx.scale(scale, scale);
            canvasCtx.clearRect(
              0,
              0,
              stickyCanvasRef.current.width,
              stickyCanvasRef.current.height,
            );
            canvasCtx.restore();
            renderBlocks();
            canScroll.current = false;
            endRenderRows.cancel();
            endRenderRows();
          }
        });

        const endRenderRows = throttle(
          () => {
            canScroll.current = true;
          },
          50,
          {
            leading: false,
            trailing: true,
          },
        );

        const renderBlocks = () => {
          if (
            slidingArenaRef.current &&
            isCurrentDraggedCanvas &&
            canvasIsDragging &&
            stickyCanvasRef.current
          ) {
            const canvasCtx: any = stickyCanvasRef.current.getContext("2d");
            canvasCtx.save();
            canvasCtx.clearRect(
              0,
              0,
              stickyCanvasRef.current.width,
              stickyCanvasRef.current.height,
            );
            isUpdatingRows = false;
            canvasCtx.transform(canvasZoomLevel, 0, 0, canvasZoomLevel, 0, 0);
            if (canvasIsDragging) {
              currentRectanglesToDraw.forEach((each) => {
                drawBlockOnCanvas(each);
              });
            }
            canvasCtx.restore();
          }
        };

        const drawBlockOnCanvas = (blockDimensions: WidgetDraggingBlock) => {
          if (
            stickyCanvasRef.current &&
            slidingArenaRef.current &&
            scrollParent &&
            isCurrentDraggedCanvas &&
            canvasIsDragging
          ) {
            const canvasCtx: any = stickyCanvasRef.current.getContext("2d");
            const topOffset = getAbsolutePixels(
              stickyCanvasRef.current.style.top,
            );
            const leftOffset = getAbsolutePixels(
              stickyCanvasRef.current.style.left,
            );
            const snappedXY = getSnappedXY(
              snapColumnSpace,
              snapRowSpace,
              {
                x: blockDimensions.left,
                y: blockDimensions.top,
              },
              {
                x: 0,
                y: 0,
              },
            );

            canvasCtx.fillStyle = `${
              blockDimensions.isNotColliding || useAutoLayout
                ? "rgb(104,	113,	239, 0.6)"
                : "red"
            }`;
            canvasCtx.fillRect(
              blockDimensions.left -
                leftOffset +
                (noPad ? 0 : CONTAINER_GRID_PADDING),
              blockDimensions.top -
                topOffset +
                (noPad ? 0 : CONTAINER_GRID_PADDING),
              blockDimensions.width,
              blockDimensions.height,
            );
            canvasCtx.fillStyle = `${
              blockDimensions.isNotColliding ? "rgb(233, 250, 243, 0.6)" : "red"
            }`;
            const strokeWidth = 1;
            canvasCtx.setLineDash([3]);
            canvasCtx.strokeStyle = "rgb(104,	113,	239)";
            canvasCtx.strokeRect(
              snappedXY.X -
                leftOffset +
                strokeWidth +
                (noPad ? 0 : CONTAINER_GRID_PADDING),
              snappedXY.Y -
                topOffset +
                strokeWidth +
                (noPad ? 0 : CONTAINER_GRID_PADDING),
              blockDimensions.width - strokeWidth,
              blockDimensions.height - strokeWidth,
            );
          }
        };
        // Adding setTimeout to make sure this gets called after
        // the onscroll that resets intersectionObserver in StickyCanvasArena.tsx
        const onScroll = () =>
          setTimeout(() => {
            const {
              lastMouseMoveEvent,
              lastScrollHeight,
              lastScrollTop,
            } = scrollObj;
            if (
              lastMouseMoveEvent &&
              typeof lastScrollHeight === "number" &&
              typeof lastScrollTop === "number" &&
              scrollParent &&
              canScroll.current
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
          }, 0);
        const captureMousePosition = (e: any) => {
          if (isDragging && !canvasIsDragging) {
            currentDirection.current = getMouseMoveDirection(e);
          }
        };
        const onMouseOver = (e: any) => onFirstMoveOnCanvas(e, true);
        const initializeListeners = () => {
          slidingArenaRef.current?.addEventListener(
            "mousemove",
            onMouseMove,
            false,
          );
          slidingArenaRef.current?.addEventListener(
            "mouseup",
            onMouseUp,
            false,
          );
          scrollParent?.addEventListener("scroll", onScroll, false);

          slidingArenaRef.current?.addEventListener(
            "mouseover",
            onMouseOver,
            false,
          );
          slidingArenaRef.current?.addEventListener(
            "mouseout",
            resetCanvasState,
            false,
          );
          slidingArenaRef.current?.addEventListener(
            "mouseleave",
            resetCanvasState,
            false,
          );
          document.body.addEventListener("mouseup", onMouseUp, false);
          window.addEventListener("mouseup", onMouseUp, false);
          window.addEventListener("mousemove", captureMousePosition);
        };
        const startDragging = () => {
          if (
            slidingArenaRef.current &&
            stickyCanvasRef.current &&
            scrollParent
          ) {
            initializeListeners();
            if (
              (isChildOfCanvas || isNewWidgetInitialTargetCanvas) &&
              slidingArenaRef.current
            ) {
              slidingArenaRef.current.style.zIndex = "2";
            }
          }
        };
        startDragging();

        return () => {
          slidingArenaRef.current?.removeEventListener(
            "mousemove",
            onMouseMove,
          );
          slidingArenaRef.current?.removeEventListener("mouseup", onMouseUp);
          scrollParent?.removeEventListener("scroll", onScroll);
          slidingArenaRef.current?.removeEventListener(
            "mouseover",
            onMouseOver,
          );
          slidingArenaRef.current?.removeEventListener(
            "mouseout",
            resetCanvasState,
          );
          slidingArenaRef.current?.removeEventListener(
            "mouseleave",
            resetCanvasState,
          );
          document.body.removeEventListener("mouseup", onMouseUp);
          window.removeEventListener("mouseup", onMouseUp);
          window.removeEventListener("mousemove", captureMousePosition);
        };
      } else {
        resetCanvasState();
      }
    }
  }, [isDragging, isResizing, blocksToDraw, snapRows, canExtend]);
  return {
    showCanvas: isDragging && !isResizing,
  };
};
