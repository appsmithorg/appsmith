import { OccupiedSpace } from "constants/CanvasEditorConstants";
import {
  CONTAINER_GRID_PADDING,
  GridDefaults,
} from "constants/WidgetConstants";
import { debounce, isEmpty, isNaN, throttle } from "lodash";
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

interface HighlightDimension {
  x: number;
  y: number;
  height: number;
  width: number;
}

const CONTAINER_JUMP_ACC_THRESHOLD = 8000;
const CONTAINER_JUMP_SPEED_THRESHOLD = 800;
const BASE_OFFSET_SIZE = 100;

let lastTranslatedIndex: number;
let containerDimensions: {
  top: number;
  left: number;
  width: number;
  height: number;
};
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

  const isEmptyWrapper = (els: any, blocks: string[]): boolean => {
    if (els === null || !blocks || !blocks.length) return false;
    const items: string[] = [];
    (els as any).forEach((el: any) => {
      const item = el.className.split("auto-layout-child-")[1];
      blocks.indexOf(item) > -1 && items.push(item);
    });
    return items?.length === els.length;
  };

  let dragBlocksSize = 0;
  let offsets: HighlightDimension[] = [];
  // let siblings: { [key: string]: number } = {};
  const siblingElements: any[] = [];
  const isVertical = direction === LayoutDirection.Vertical;

  const initializeOffsets = (): void => {
    offsets = [];
    let mOffset: HighlightDimension;
    if (isVertical) {
      mOffset = {
        x: 0,
        y: 8,
        width: containerDimensions.width || BASE_OFFSET_SIZE,
        height: 4,
      };
    } else {
      mOffset = {
        x: 8,
        y: 0,
        width: 4,
        height: containerDimensions.height || BASE_OFFSET_SIZE,
      };
    }
    offsets.push(mOffset);
  };

  const calculateHighlightOffsets = () => {
    if (useAutoLayout && isDragging && isCurrentDraggedCanvas) {
      // console.log("#### START calculate highlight offsets");
      // console.log(`#### canvas id: ${widgetId}`);
      // calculate total drag size to translate siblings by
      blocksToDraw?.map((each) => {
        dragBlocksSize += isVertical ? each.height : each.width;
      });
      // update dimensions of the current canvas
      const container = document.querySelector(`.flex-container-${widgetId}`);
      containerDimensions = {
        top: (container as any).offsetTop || 0,
        left: (container as any).offsetLeft || 0,
        width: (container as any).clientWidth,
        height: (container as any).clientHeight,
      };

      initializeOffsets();

      // Get all children of current dragging canvas
      const els = document.querySelectorAll(`.auto-layout-parent-${widgetId}`);
      if (els && els.length && offsets.length !== els.length) {
        // Get widget ids of all widgets being dragged
        const blocks = blocksToDraw.map((block) => block.widgetId);
        els.forEach((el) => {
          // Extract widget id of current widget
          const mClass = el.className
            .split("auto-layout-child-")[1]
            .split(" ")[0];
          const emptyWrapper: boolean = isEmptyWrapper(
            el.querySelectorAll("div[class*=auto-layout-child]"),
            blocks,
          );
          /**
           * If the widget is also being dragged,
           * Or if the layout wrapper is empty,
           * then discount its presence from offset calculation.
           */
          if (
            blocks &&
            blocks.length &&
            (blocks.indexOf(mClass) > -1 || emptyWrapper)
          ) {
            // Temporarily hide the dragged widget
            (el as any).classList.add("auto-temp-no-display");
            return;
          } else {
            // Add a new offset using the current element's dimensions and position
            let mOffset: HighlightDimension;
            if (isVertical) {
              mOffset = {
                x: 0,
                y: (el as any).offsetTop - 2 * containerDimensions.top,
                width: containerDimensions.width,
                height: 4,
              };
            } else {
              mOffset = {
                x: (el as any).offsetLeft - 2 * containerDimensions.left,
                y: (el as any).offsetTop - 2 * containerDimensions.top,
                height: (el as any).clientHeight,
                width: 4,
              };
            }
            offsets.push(mOffset);
            // siblings[mClass] = mOffset;
            siblingElements.push(el);
          }
        });
        /**
         * If the dragged element has siblings,
         * then add another offset at the end of the last sibling
         * to demarcate the final drop position.
         */
        if (siblingElements.length) {
          let finalOffset: HighlightDimension;
          if (isVertical) {
            finalOffset = {
              x: 0,
              y:
                (siblingElements[siblingElements.length - 1] as any).offsetTop -
                2 * containerDimensions.top +
                siblingElements[siblingElements.length - 1].clientHeight +
                8,
              width: containerDimensions.width,
              height: 4,
            };
          } else {
            finalOffset = {
              x:
                (siblingElements[siblingElements.length - 1] as any)
                  .offsetLeft -
                containerDimensions.left +
                siblingElements[siblingElements.length - 1].clientWidth +
                8,
              y:
                (siblingElements[siblingElements.length - 1] as any).offsetTop -
                2 * containerDimensions.top +
                8,
              width: 4,
              height: (siblingElements[siblingElements.length - 1] as any)
                .clientHeight,
            };
          }
          offsets.push(finalOffset);
        }
        offsets = [...new Set(offsets)];
      }
      // console.log(`#### offsets: ${JSON.stringify(offsets)}`);
      // console.log(`#### END calculate highlight offsets`);
    }
  };
  calculateHighlightOffsets();

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
            const pos = getDropPosition({
              x: currentRectanglesToDraw[0].top,
              y: currentRectanglesToDraw[0].left,
            });
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
        const translateSiblings = (position: HighlightDimension): void => {
          let dropIndex = 0;
          if (position)
            dropIndex = offsets
              ?.map((each) => `${each.x},${each.y}`)
              .indexOf(`${position.x},${position.y}`);

          if (dropIndex === lastTranslatedIndex) return;

          lastTranslatedIndex = dropIndex;
          // console.log(`#### lastTranslatedIndex: ${lastTranslatedIndex}`);
          return;
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
        };
        const highlightDropPosition = (e: any) => {
          if (!useAutoLayout) return;
          const pos: HighlightDimension | undefined = getHighlightPosition(e);
          // console.log(`#### Highlight position: ${JSON.stringify(pos)}`);
          if (!pos) return;
          if (dropPositionRef && dropPositionRef.current) {
            dropPositionRef.current.style.opacity = "1";
            dropPositionRef.current.style.top =
              (pos.y > 6 ? pos.y - 6 : 0) + "px";
            dropPositionRef.current.style.left =
              (pos.x > 6
                ? Math.min(
                    pos.x - 6,
                    containerDimensions.left + containerDimensions.width - 6,
                  )
                : 0) + "px";
            dropPositionRef.current.style.width = pos.width + "px";
            dropPositionRef.current.style.height = pos.height + "px";
          }
          translateSiblings(pos);
        };
        const getHighlightPosition = (
          e: any,
          val?: XYCord,
        ): HighlightDimension => {
          let base: HighlightDimension[] = [];
          if (!offsets || !offsets.length) initializeOffsets();
          else base = offsets;

          const pos: XYCord = {
            x: e?.offsetX || val?.x,
            y: e?.offsetY || val?.y,
          };

          const arr = [...base].sort((a, b) => {
            return calculateDistance(a, pos) - calculateDistance(b, pos);
          });
          return arr[0];
        };
        const calculateDistance = (
          a: HighlightDimension,
          b: XYCord,
        ): number => {
          const x: number = a.x + a.width / 2 - b.x;
          const y: number = a.y + a.height / 2 - b.y;
          return Math.abs(Math.sqrt(x * x + y * y));
        };
        const getDropPosition = (val: XYCord): number | undefined => {
          if (!isNaN(lastTranslatedIndex) && lastTranslatedIndex >= 0)
            return lastTranslatedIndex;
          const pos = getHighlightPosition(null, val);
          if (!pos) return;
          // console.log(`#### drop position: ${offsets.indexOf(pos)}`);
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
