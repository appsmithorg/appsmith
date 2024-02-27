import { CANVAS_ART_BOARD } from "constants/componentClassNameConstants";
import { Indices } from "constants/Layers";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import type { LayoutElementPosition } from "layoutSystems/common/types";
import { positionObserver } from "layoutSystems/common/utils/LayoutElementPositionsObserver";
import { getAnvilLayoutDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";
import { debounce, uniq } from "lodash";
import { useEffect, useRef } from "react";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";
import { useCanvasActivationStates } from "./useCanvasActivationStates";
import { canActivateCanvasForDraggedWidget } from "../utils";
import { LayoutComponentTypes } from "layoutSystems/anvil/utils/anvilTypes";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { useSelector } from "react-redux";
import { getWidgets } from "sagas/selectors";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";

// Z-Index values for activated and deactivated states
export const AnvilCanvasZIndex = {
  // we can decrease the z-index once we are able to provide fix for the issue #28471
  activated: Indices.Layer10.toString(),
  deactivated: "",
};

// Function to check if mouse position is inside a block
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

// Buffer value for the main canvas
// This buffer will make sure main canvas is not deactivated
// until its about the below pixel distance from the main canvas border.
const MAIN_CANVAS_BUFFER = 20;
const SECTION_BUFFER = 20;

/**
 * This hook handles the activation and deactivation of the canvas(Drop targets) while dragging.
 */

export const useCanvasActivation = () => {
  const {
    activateOverlayWidgetDrop,
    dragDetails,
    draggedWidgetHierarchy,
    isDragging,
    isNewWidget,
    layoutElementPositions,
    mainCanvasLayoutId,
    selectedWidgets,
  } = useCanvasActivationStates();
  const allWidgets: CanvasWidgetsReduxState = useSelector(getWidgets);
  // Getting the main canvas DOM node
  const mainContainerDOMNode = document.getElementById(CANVAS_ART_BOARD);

  // Destructuring hook functions for drag and resize functionality
  const { setDraggingCanvas, setDraggingNewWidget, setDraggingState } =
    useWidgetDragResize();

  // Mapping selected widget positions
  const draggedWidgetPositions = selectedWidgets.map((each) => {
    return layoutElementPositions[each];
  });
  /**
   * boolean ref that indicates if the mouse position is outside of main canvas while dragging
   * this is being tracked in order to activate/deactivate canvas.
   */
  const isMouseOutOfMainCanvas = useRef(false);

  // Function to handle mouse leaving the canvas while dragging
  const mouseOutOfCanvasArtBoard = () => {
    isMouseOutOfMainCanvas.current = true;
    setDraggingCanvas();
  };

  // Debouncing functions for smoother transitions
  const debouncedSetDraggingCanvas = debounce(setDraggingCanvas);
  const debouncedMouseOutOfCanvasArtBoard = debounce(mouseOutOfCanvasArtBoard);

  // All layouts registered on the position observer
  const allLayouts: any = isDragging
    ? positionObserver.getRegisteredLayouts()
    : {};

  // All layout IDs on the page
  const allLayoutIds = Object.keys(allLayouts);

  // DOM ID of the main canvas layout
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
  // All droppable layout IDs
  const allDroppableLayoutIds = uniq(
    filteredLayoutIds
      .filter((each) => {
        const layoutInfo = allLayouts[each];
        const currentPositions = layoutElementPositions[layoutInfo.layoutId];
        const widget: FlattenedWidgetProps = allWidgets[layoutInfo.canvasId];
        const canActivate = canActivateCanvasForDraggedWidget(
          draggedWidgetHierarchy,
          widget?.widgetId,
          widget?.type,
        );
        return canActivate && currentPositions && !!layoutInfo.isDropTarget;
      })
      .map((each) => allLayouts[each].layoutId),
  );
  /**
   * Droppable layout IDs sorted by area in ascending order
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
      // Getting the main canvas bounding rect
      const mainCanvasRect = mainContainerDOMNode.getBoundingClientRect();

      // Checking if the mouse position is outside of dragging widgets
      const isMousePositionOutsideOfDraggingWidgets =
        !isNewWidget &&
        draggedWidgetPositions.find((each) => {
          return checkIfMousePositionIsInsideBlock(e, mainCanvasRect, each);
        });

      // Finding the layout under the mouse position
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
            const layoutInfo = allLayouts[each];
            if (layoutInfo.layoutType === LayoutComponentTypes.SECTION) {
              currentCanvasPositions.top += SECTION_BUFFER;
              currentCanvasPositions.height -= 2 * SECTION_BUFFER;
              currentCanvasPositions.width += 2 * SECTION_BUFFER;
              currentCanvasPositions.left -= SECTION_BUFFER;
            }
            if (currentCanvasPositions) {
              return checkIfMousePositionIsInsideBlock(
                e,
                mainCanvasRect,
                currentCanvasPositions,
              );
            }
          });

      // Handling canvas activation and deactivation
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

  // Callback function to handle mouse up events and reset dragging state
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
    if (isDragging) {
      // Adding event listeners for mouse move and mouse up events
      document?.addEventListener("mousemove", onMouseMoveWhileDragging);
      document.body.addEventListener("mouseup", onMouseUp, false);
      window.addEventListener("mouseup", onMouseUp, false);

      // Removing event listeners when the component unmounts or when dragging ends
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
