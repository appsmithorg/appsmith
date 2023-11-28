import { CANVAS_ART_BOARD } from "constants/componentClassNameConstants";
import { Indices } from "constants/Layers";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import type { LayoutElementPosition } from "layoutSystems/common/types";
import { positionObserver } from "layoutSystems/common/utils/LayoutElementPositionsObserver";
import { getAnvilLayoutDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";
import { debounce } from "lodash";
import { useEffect, useRef } from "react";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";
import type { AnvilDnDStates } from "./useAnvilDnDStates";

export const AnvilCanvasZIndex = {
  activated: Indices.Layer10.toString(),
  deactivated: "",
};

const checkIfMousePositionIsInsideBlock = (
  e: MouseEvent,
  mainCanvasRect: DOMRect,
  layoutElementPosition: LayoutElementPosition,
) => {
  return (
    layoutElementPosition.left <= e.clientX - mainCanvasRect.left &&
    e.clientX - mainCanvasRect.left <=
      layoutElementPosition.left + layoutElementPosition.width &&
    layoutElementPosition.top <= e.clientY - mainCanvasRect.top &&
    e.clientY - mainCanvasRect.top <=
      layoutElementPosition.top + layoutElementPosition.height
  );
};

const MAIN_CANVAS_BUFFER = 20;

export const useCanvasActivation = (
  anvilDragStates: AnvilDnDStates,
  layoutId: string,
) => {
  const {
    activateOverlayWidgetDrop,
    dragDetails,
    isDragging,
    isNewWidget,
    layoutElementPositions,
    mainCanvasLayoutId,
  } = anvilDragStates;
  const mainContainerDOMNode = document.getElementById(CANVAS_ART_BOARD);
  const { setDraggingCanvas, setDraggingNewWidget, setDraggingState } =
    useWidgetDragResize();
  const draggedWidgetPositions = anvilDragStates.selectedWidgets.map((each) => {
    return layoutElementPositions[each];
  });
  const debouncedSetDraggingCanvas = debounce(setDraggingCanvas);
  /**
   * boolean ref that indicates if the mouse position is outside of main canvas while dragging
   * this is being tracked in order to activate/deactivate canvas.
   */
  const isMouseOutOfMainCanvas = useRef(false);
  const mouseOutOfCanvasArtBoard = () => {
    isMouseOutOfMainCanvas.current = true;
    setDraggingCanvas();
  };
  const debouncedMouseOutOfCanvasArtBoard = debounce(mouseOutOfCanvasArtBoard);

  /**
   * all layouts registered on the position observer.
   */
  const allLayouts: any =
    layoutId === mainCanvasLayoutId && isDragging
      ? positionObserver.getRegisteredLayouts()
      : {};

  /**
   * all domIds of layouts on the page.
   */
  const allLayoutIds = Object.keys(allLayouts);
  /**
   * domId of main canvas layout
   */
  const mainCanvasLayoutDomId = getAnvilLayoutDOMId(
    MAIN_CONTAINER_WIDGET_ID,
    mainCanvasLayoutId,
  );
  /**
   * layoutIds that are supported to drop while dragging.
   * when dragging an AnvilOverlayWidgetTypes widget only the main canvas is supported for dropping.
   */
  const filteredLayoutIds: string[] = activateOverlayWidgetDrop
    ? allLayoutIds.filter((each) => each === mainCanvasLayoutDomId)
    : allLayoutIds;
  /**
   * all layoutIds where widgets can be dropped.
   */
  const allDroppableLayoutIds = filteredLayoutIds
    .filter((each) => {
      const layoutInfo = allLayouts[each];
      const currentPositions = layoutElementPositions[layoutInfo.layoutId];
      return currentPositions && !!layoutInfo.isDropTarget;
    })
    .map((each) => allLayouts[each].layoutId);

  /**
   * layoutIds sorted by area of each layout in ascending order.
   * This is done because a point can be inside multiple canvas areas, but only the smallest of them is the immediate parent.
   */
  const smallToLargeSortedDroppableLayoutIds = allDroppableLayoutIds.sort(
    (droppableLayout1Id: string, droppableLayout2Id: string) => {
      const droppableLayout1 = layoutElementPositions[droppableLayout1Id];
      const droppableLayout2 = layoutElementPositions[droppableLayout2Id];
      return (
        droppableLayout1.height * droppableLayout1.width -
        droppableLayout2.height * droppableLayout2.width
      );
    },
  );
  /**
   * Callback function to handle mouse move events while dragging state is set.
   * The function uses the mouse position and checks through smallToLargeSortedDroppableLayoutIds
   * to find under which layout the point is positioned and activates that layout canvas.
   *
   * Canvas activation means that the layout's canvas is raised up in z-index to register and process mouse events
   * and draw highlights appropriately.
   */
  const onMouseMoveWhileDragging = (e: MouseEvent) => {
    if (
      isDragging &&
      mainContainerDOMNode &&
      smallToLargeSortedDroppableLayoutIds.length > 0
    ) {
      const mainCanvasRect = mainContainerDOMNode.getBoundingClientRect();
      const isMousePositionOutsideOfDraggingWidgets =
        !isNewWidget &&
        draggedWidgetPositions.find((each) => {
          return checkIfMousePositionIsInsideBlock(e, mainCanvasRect, each);
        });
      const hoveredCanvas = isMousePositionOutsideOfDraggingWidgets
        ? dragDetails.dragGroupActualParent
        : smallToLargeSortedDroppableLayoutIds.find((each) => {
            const currentCanvasPositions = { ...layoutElementPositions[each] };
            if (each === mainCanvasLayoutId) {
              currentCanvasPositions.left -= MAIN_CANVAS_BUFFER;
              currentCanvasPositions.top -= MAIN_CANVAS_BUFFER;
              currentCanvasPositions.width += 2 * MAIN_CANVAS_BUFFER;
              currentCanvasPositions.height += 2 * MAIN_CANVAS_BUFFER;
            }
            if (currentCanvasPositions) {
              return checkIfMousePositionIsInsideBlock(
                e,
                mainCanvasRect,
                currentCanvasPositions,
              );
            }
          });
      if (dragDetails.draggedOn !== hoveredCanvas) {
        if (hoveredCanvas) {
          isMouseOutOfMainCanvas.current = false;
          debouncedSetDraggingCanvas(hoveredCanvas);
        } else {
          debouncedMouseOutOfCanvasArtBoard();
        }
      }
    }
  };

  /**
   * callback function to process mouse up events and reset dragging state.
   */
  const onMouseUp = () => {
    if (isDragging) {
      if (isNewWidget) {
        setDraggingNewWidget(false, undefined);
      } else {
        setDraggingState({
          isDragging: false,
        });
      }
    }
  };
  useEffect(() => {
    if (isDragging && layoutId === mainCanvasLayoutId) {
      document?.addEventListener("mousemove", onMouseMoveWhileDragging);
      document.body.addEventListener("mouseup", onMouseUp, false);
      window.addEventListener("mouseup", onMouseUp, false);
      return () => {
        document?.removeEventListener("mousemove", onMouseMoveWhileDragging);
        document.body.removeEventListener("mouseup", onMouseUp);
        window.removeEventListener("mouseup", onMouseUp);
      };
    }
  }, [
    isDragging,
    onMouseMoveWhileDragging,
    onMouseUp,
    debouncedMouseOutOfCanvasArtBoard,
  ]);
};
