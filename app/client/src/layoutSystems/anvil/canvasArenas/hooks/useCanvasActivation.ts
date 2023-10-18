import { CANVAS_ART_BOARD } from "constants/componentClassNameConstants";
import { Indices } from "constants/Layers";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { positionObserver } from "layoutSystems/common/utils/LayoutElementPositionsObserver";
import { getAnvilLayoutDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";
import { useEffect, useRef } from "react";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";
import type { AnvilDnDStates } from "./useAnvilDnDStates";

export const AnvilCanvasZIndex = {
  activated: Indices.Layer10.toString(),
  deactivated: "",
};
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
  /**
   * boolean ref that indicates if the mouse position is outside of main canvas while dragging
   * this is being tracked in order to activate/deactivate canvas.
   */
  const isMouseOutOfMainCanvas = useRef(false);
  const mouseOutOfCanvasArtBoard = () => {
    isMouseOutOfMainCanvas.current = true;
    setDraggingCanvas();
  };

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
  const filteredLayoutIds = activateOverlayWidgetDrop
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
      const hoveredCanvas = smallToLargeSortedDroppableLayoutIds.find(
        (each) => {
          const currentCanvasPositions = layoutElementPositions[each];
          if (currentCanvasPositions) {
            return (
              currentCanvasPositions.left <= e.clientX - mainCanvasRect.left &&
              e.clientX - mainCanvasRect.left <=
                currentCanvasPositions.left + currentCanvasPositions.width &&
              currentCanvasPositions.top <= e.clientY - mainCanvasRect.top &&
              e.clientY - mainCanvasRect.top <=
                currentCanvasPositions.top + currentCanvasPositions.height
            );
          }
        },
      );
      if (dragDetails.draggedOn !== hoveredCanvas) {
        if (hoveredCanvas) {
          isMouseOutOfMainCanvas.current = false;
          setDraggingCanvas(hoveredCanvas);
        } else {
          mouseOutOfCanvasArtBoard();
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
    mouseOutOfCanvasArtBoard,
  ]);
};
