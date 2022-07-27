import { OccupiedSpace } from "constants/CanvasEditorConstants";
import {
  CONTAINER_GRID_PADDING,
  GridDefaults,
} from "constants/WidgetConstants";
import { debounce, isEmpty, isNumber, throttle } from "lodash";
import { CanvasDraggingArenaProps } from "pages/common/CanvasArenas/CanvasDraggingArena";
import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
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
import {
  useBlocksToBeDraggedOnCanvas,
  WidgetDraggingBlock,
} from "./useBlocksToBeDraggedOnCanvas";
import { useCanvasDragToScroll } from "./useCanvasDragToScroll";
import ContainerJumpMetrics from "./ContainerJumpMetric";
import { LayoutDirection } from "components/constants";

export interface XYCord {
  x: number;
  y: number;
}

const CONTAINER_JUMP_ACC_THRESHOLD = 8000;
const CONTAINER_JUMP_SPEED_THRESHOLD = 800;

let dragBlocksSize = 0;
let lastTranslatedIndex: number;
//Since useCanvasDragging's Instance changes during container jump, metrics is stored outside
const containerJumpThresholdMetrics = new ContainerJumpMetrics<{
  speed?: number;
  acceleration?: number;
}>();

export const useCanvasDragging = (
  dropPositionRef: React.RefObject<HTMLDivElement>,
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

  const cleanUpTempStyles = () => {
    // reset display of all dragged blocks
    const els = document.querySelectorAll(`.auto-layout-parent-${widgetId}`);
    if (els && els.length) {
      els.forEach((el) => {
        (el as any).classList.remove("auto-temp-no-display");
        (el as any).style.transform = null;
      });
    }

    // reset state
    dragBlocksSize = 0;
    lastTranslatedIndex = -10;
  };

  if (!isDragging) {
    cleanUpTempStyles();
  }
  const offsets: number[] = [];
  // let siblings: { [key: string]: number } = {};
  const siblingElements: any[] = [];
  const isVertical = direction === LayoutDirection.Vertical;
  const calculateHighlightOffsets = () => {
    if (isNewWidget)
      dragBlocksSize = isVertical
        ? blocksToDraw[0].height
        : blocksToDraw[0].width;
    if (
      useAutoLayout &&
      isDragging &&
      isCurrentDraggedCanvas &&
      isChildOfCanvas
    ) {
      // Get all children of current auto layout container
      const els = document.querySelectorAll(`.auto-layout-parent-${widgetId}`);
      if (els && els.length && offsets.length !== els.length) {
        // Get widget ids of all widgets being dragged
        console.log(els);
        const blocks = blocksToDraw.map((block) => block.widgetId);
        // console.log("*********");
        els.forEach((el, index) => {
          // console.log((el as any).offsetParent);
          // Extract widget id of current widget
          const mClass = el.className
            .split("auto-layout-child-")[1]
            .split(" ")[0];
          // console.log(`parentId: ${widgetId}`);
          console.log(`widgetID: ${mClass}`);
          // console.log(`blocks: ${blocks}`);
          // console.log(blocks);
          /**
           * If the widget is also being dragged,
           * then discount its presence from offset calculation.
           */
          const width = (el as any).clientWidth || (el as any).offsetWidth;
          const height = (el as any).clientHeight || (el as any).offsetHeight;
          if (blocks && blocks.length && blocks.indexOf(mClass) !== -1) {
            // Temporarily hide the dragged widget
            console.log(el as any);
            console.log((el as any).offsetWidth);
            console.log((el as any).clientWidth);
            console.log((el as any).clientHeight);
            console.log((el as any).offsetHeight);
            console.log((el as any).getBoundingClientRect());
            console.log(els[index].clientWidth);
            console.log(width);
            console.log(height);
            dragBlocksSize += isVertical ? height : width;
            console.log(`block size: ${dragBlocksSize}`);
            (el as any).classList.add("auto-temp-no-display");
            return;
          } else {
            const mOffset = isVertical
              ? (el as any).offsetTop
              : (el as any).offsetLeft;
            // console.log(`offset: ${mOffset}`);
            offsets.push(mOffset);
            // console.log(offsets);
            // siblings[mClass] = mOffset;
            siblingElements.push(el);
          }
        });
        offsets.push(
          siblingElements.length
            ? isVertical
              ? (siblingElements[siblingElements.length - 1] as any).offsetTop +
                siblingElements[siblingElements.length - 1].clientHeight +
                8
              : (siblingElements[siblingElements.length - 1] as any)
                  .offsetLeft +
                siblingElements[siblingElements.length - 1].clientWidth +
                8
            : 8,
        );
        // console.log(offsets);
      }
    }
  };
  calculateHighlightOffsets();

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
        isIdealToJumpContainer: false,
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
            // console.log(currentRectanglesToDraw);
            // console.log(reflowedPositionsUpdatesWidgets);
            const pos = getDropPosition(
              isVertical
                ? currentRectanglesToDraw[0].top
                : currentRectanglesToDraw[0].left,
            );
            // console.log(`#### pos: ${pos}`);
            if (pos !== undefined && useAutoLayout) {
              // cleanUpTempStyles();
              updateChildrenPositions(pos, currentRectanglesToDraw);
            } else
              onDrop(currentRectanglesToDraw, reflowedPositionsUpdatesWidgets);
          }
          startPoints.top = defaultHandlePositions.top;
          startPoints.left = defaultHandlePositions.left;
          resetCanvasState();

          if (isCurrentDraggedCanvas) {
            if (isNewWidget) {
              setDraggingNewWidget(false, undefined);
            } else {
              setDraggingState({
                isDragging: false,
              });
            }
            setDraggingCanvas();
          }
        };

        const onFirstMoveOnCanvas = (e: any, over = false) => {
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
            if (!isCurrentDraggedCanvas) {
              //Called when canvas Changes
              const {
                acceleration,
                speed,
              } = containerJumpThresholdMetrics.getMetrics();

              logContainerJump(widgetId, speed, acceleration);
              containerJumpThresholdMetrics.clearMetrics();
              // we can just use canvasIsDragging but this is needed to render the relative DragLayerComponent
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
        const getMouseMoveDirection = (event: any) => {
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
            if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 0) {
              return ReflowDirection.TOP;
            } else if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY < 0) {
              return ReflowDirection.BOTTOM;
            }
            if (
              deltaY === 0 &&
              ["LEFT", "RIGHT"].includes(currentDirection.current)
            ) {
              return currentDirection.current;
            }
            if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 0) {
              return ReflowDirection.LEFT;
            } else if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < 0) {
              return ReflowDirection.RIGHT;
            }
          }
          return currentDirection.current;
        };
        const triggerReflow = (e: any, firstMove: boolean) => {
          const canReflowBasedOnMouseSpeed = canReflowForCurrentMouseMove();
          const isReflowing = !isEmpty(currentReflowParams.movementMap);
          const canReflow =
            !currentRectanglesToDraw[0].detachFromLayout && !dropDisabled;
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
        const onMouseMove = (e: any, firstMove = false) => {
          if (isDragging && canvasIsDragging && slidingArenaRef.current) {
            const delta = {
              left: e.offsetX - startPoints.left - parentDiff.left,
              top: e.offsetY - startPoints.top - parentDiff.top,
            };

            const drawingBlocks = blocksToDraw.map((each) => ({
              ...each,
              left: each.left + delta.left,
              top: each.top + delta.top,
            }));
            const newRows = updateRelativeRows(drawingBlocks, rowRef.current);
            const rowDelta = newRows ? newRows - rowRef.current : 0;
            rowRef.current = newRows ? newRows : rowRef.current;
            currentRectanglesToDraw = drawingBlocks.map((each) => ({
              ...each,
              isNotColliding:
                !dropDisabled &&
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
                ),
            }));
            if (rowDelta && slidingArenaRef.current) {
              isUpdatingRows = true;
              canScroll.current = false;
              renderNewRows(delta);
            } else if (!isUpdatingRows) {
              triggerReflow(e, firstMove);
              isCurrentDraggedCanvas && highlightDropPosition(e);
              renderBlocks();
            }
            scrollObj.lastMouseMoveEvent = {
              offsetX: e.offsetX,
              offsetY: e.offsetY,
            };
            scrollObj.lastScrollTop = scrollParent?.scrollTop;
            scrollObj.lastScrollHeight = scrollParent?.scrollHeight;
          } else {
            onFirstMoveOnCanvas(e);
          }
        };
        const translateSiblings = (position: number): void => {
          let dropIndex = 0;
          if (isNumber(position)) dropIndex = offsets.indexOf(position);

          if (dropIndex === lastTranslatedIndex) return;
          // Get all siblings after the highlighted drop position
          const arr = [...siblingElements];

          // translate each element in the appropriate direction
          const x = !isVertical ? dragBlocksSize : 0;
          const y = isVertical ? dragBlocksSize : 0;
          arr.forEach((each, index) => {
            if (index < dropIndex) {
              each.style.transform = null;
            } else {
              each.style.transform = `translate(${x}px, ${y}px)`;
              each.style.transitionDuration = "0.2s";
            }
          });
          lastTranslatedIndex = dropIndex;
        };
        const highlightDropPosition = (e: any) => {
          if (!useAutoLayout) return;
          const pos: number | undefined = getHighlightPosition(e);
          if (!pos) return;
          // console.log(`#### ref: ${dropPositionRef.current}`);
          if (dropPositionRef && dropPositionRef.current) {
            dropPositionRef.current.style.opacity = "1";
            if (isVertical) dropPositionRef.current.style.top = pos - 6 + "px";
            else dropPositionRef.current.style.left = pos - 6 + "px";
          }
          translateSiblings(pos);
        };
        const getHighlightPosition = (e: any, val?: number) => {
          let base: number[] = [];
          if (!offsets || !offsets.length) base = [8];
          else base = offsets;
          const pos = (isVertical ? e?.offsetY : e?.offsetX) || val;
          // console.log(e);
          // console.log(pos);
          const arr = [...base].sort((a, b) => {
            return Math.abs(a - pos) - Math.abs(b - pos);
          });
          return arr[0];
        };
        const getDropPosition = (val: number): number | undefined => {
          const pos = getHighlightPosition(null, val);
          if (!pos) return;
          return offsets.indexOf(pos);
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
            // console.log(`${widgetId} =======`);
            // console.log(currentDirection);
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
