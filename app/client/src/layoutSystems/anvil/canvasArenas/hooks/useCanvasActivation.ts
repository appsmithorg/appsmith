import { CANVAS_ART_BOARD } from "constants/componentClassNameConstants";
import { Indices } from "constants/Layers";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import type { DraggedWidget } from "layoutSystems/anvil/utils/anvilTypes";
import type { LayoutElementPosition } from "layoutSystems/common/types";
import { positionObserver } from "layoutSystems/common/utils/LayoutElementPositionsObserver";
import { getAnvilLayoutDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";
import { throttle } from "lodash";
import { useEffect, useRef } from "react";
import type { DragDetails } from "reducers/uiReducers/dragResizeReducer";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";
import WidgetFactory from "WidgetProvider/factory";
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

const createNewWidgetPreview = (dragDetails: DragDetails): HTMLDivElement => {
  const type = `${dragDetails.newWidget.type
    .split("_")
    .join("")
    .toLowerCase()}`;
  const cardDiv = document.getElementById(`widget-card-draggable-${type}`);
  const clonedDiv = cardDiv?.cloneNode(true) as HTMLDivElement;
  clonedDiv.style.position = "absolute";
  clonedDiv.style.zIndex = AnvilCanvasZIndex.activated;
  clonedDiv.style.pointerEvents = "none";
  clonedDiv.style.top = "-100px";
  clonedDiv.style.position = "-100px";
  clonedDiv.style.border = "2px solid black";
  clonedDiv.style.background = "white";
  clonedDiv.style.width = cardDiv?.clientWidth + "px";
  clonedDiv.style.height = cardDiv?.clientHeight + "px";
  return clonedDiv;
};

const createSelectedWidgetsPreview = (
  draggedBlocks: DraggedWidget[],
): HTMLDivElement => {
  const parentWrapperDiv = document.createElement("div");
  draggedBlocks.forEach((each, i) => {
    if (i < 2) {
      const wrapperDiv = document.createElement("div");
      wrapperDiv.style.display = "flex";
      wrapperDiv.style.justifyContent = "center";
      wrapperDiv.style.alignItems = "center";
      const textDiv = document.createElement("text");
      textDiv.innerText =
        WidgetFactory.getConfig(each.type)?.widgetName || each.type;
      wrapperDiv.appendChild(textDiv);
      wrapperDiv.style.border = "1px solid black";
      wrapperDiv.style.minHeight = "50px";
      wrapperDiv.style.minWidth = "100px";
      wrapperDiv.style.width = "100%";
      wrapperDiv.style.height = "100%";
      wrapperDiv.style.padding = "5px 5px";
      wrapperDiv.style.pointerEvents = "none";
      parentWrapperDiv.appendChild(wrapperDiv);
    }
  });

  parentWrapperDiv.style.display = "flex";
  parentWrapperDiv.style.flexDirection = "row";
  parentWrapperDiv.style.position = "absolute";
  parentWrapperDiv.style.zIndex = AnvilCanvasZIndex.activated;
  parentWrapperDiv.style.pointerEvents = "none";
  parentWrapperDiv.style.top = "-100px";
  parentWrapperDiv.style.position = "-100px";
  parentWrapperDiv.style.border = "1px solid black";
  parentWrapperDiv.style.background = "white";
  parentWrapperDiv.style.maxWidth = "300px";
  if (draggedBlocks.length > 2) {
    const notifDiv = document.createElement("div");
    notifDiv.style.display = "inline-block";
    notifDiv.style.textAlign = "center";
    notifDiv.style.position = "absolute";
    notifDiv.style.borderRadius = "50%";
    notifDiv.style.height = "25px";
    notifDiv.style.width = "25px";
    notifDiv.style.top = "-12.5px";
    notifDiv.style.left = "calc(100% - 12.5px)";
    notifDiv.style.lineHeight = "25px";
    notifDiv.style.background = "white";
    notifDiv.style.border = "1px solid orange";
    const textDiv = document.createElement("text");
    textDiv.innerText = `${+draggedBlocks.length - 2}`;
    notifDiv.appendChild(textDiv);
    parentWrapperDiv.appendChild(notifDiv);
  }
  return parentWrapperDiv;
};

export const useCanvasActivation = (
  anvilDragStates: AnvilDnDStates,
  layoutId: string,
) => {
  const {
    activateOverlayWidgetDrop,
    dragDetails,
    draggedBlocks,
    isDragging,
    isNewWidget,
    layoutElementPositions,
    mainCanvasLayoutId,
  } = anvilDragStates;
  const mainContainerDOMNode = document.getElementById(CANVAS_ART_BOARD);
  const { setDraggingCanvas, setDraggingNewWidget, setDraggingState } =
    useWidgetDragResize();
  const throttleSetDraggingCanvas = throttle(setDraggingCanvas, 50);
  const draggedWidgetPositions = anvilDragStates.selectedWidgets.map((each) => {
    return layoutElementPositions[each];
  });
  const currentActivatedLayout = useRef("");
  /**
   * boolean ref that indicates if the mouse position is outside of main canvas while dragging
   * this is being tracked in order to activate/deactivate canvas.
   */
  const isMouseOutOfMainCanvas = useRef(false);
  const mouseOutOfCanvasArtBoard = () => {
    if (!isMouseOutOfMainCanvas.current) {
      isMouseOutOfMainCanvas.current = true;
      if (dragPreviewRef.current) {
        dragPreviewRef.current.style.zIndex = "unset";
      }
      if (currentActivatedLayout.current !== "") {
        currentActivatedLayout.current = "";
        throttleSetDraggingCanvas();
      }
    }
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
    // e.preventDefault();
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
      const hoveredLayoutId = isMousePositionOutsideOfDraggingWidgets
        ? dragDetails.dragGroupActualParent
        : smallToLargeSortedDroppableLayoutIds.find((each) => {
            const currentCanvasPositions = layoutElementPositions[each];
            if (currentCanvasPositions) {
              return checkIfMousePositionIsInsideBlock(
                e,
                mainCanvasRect,
                currentCanvasPositions,
              );
            }
          });
      if (currentActivatedLayout.current !== hoveredLayoutId) {
        if (hoveredLayoutId) {
          isMouseOutOfMainCanvas.current = false;
          currentActivatedLayout.current = hoveredLayoutId;
          throttleSetDraggingCanvas(hoveredLayoutId);
        } else {
          mouseOutOfCanvasArtBoard();
        }
      }
    }
  };

  /**
   * callback function to process mouse up events and reset dragging state.
   */
  const onMouseUp = (e: any) => {
    e.preventDefault();
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
  const dragPreviewRef = useRef<HTMLDivElement>();
  const renderDragPreview = (e: MouseEvent) => {
    if (isDragging) {
      if (dragPreviewRef.current) {
        dragPreviewRef.current.style.left = `${e.clientX}px`;
        dragPreviewRef.current.style.top = `${e.clientY}px`;
        if (
          dragPreviewRef.current.style.zIndex !== AnvilCanvasZIndex.activated
        ) {
          dragPreviewRef.current.style.zIndex = AnvilCanvasZIndex.activated;
        }
      }
    }
  };
  useEffect(() => {
    if (isDragging && layoutId === mainCanvasLayoutId) {
      currentActivatedLayout.current = dragDetails.draggedOn || "";
      if (!dragPreviewRef.current && !isNewWidget) {
        dragPreviewRef.current = isNewWidget
          ? createNewWidgetPreview(dragDetails)
          : createSelectedWidgetsPreview(draggedBlocks);
        document.body.appendChild(dragPreviewRef.current);
      }
      document?.addEventListener("mousemove", onMouseMoveWhileDragging);
      document?.addEventListener("mousemove", renderDragPreview);
      document?.addEventListener("dragover", onMouseMoveWhileDragging);
      document.body.addEventListener("mouseup", onMouseUp, false);
      document.body.addEventListener("drop", onMouseUp, false);
      window.addEventListener("mouseup", onMouseUp, false);
      return () => {
        document?.removeEventListener("mousemove", onMouseMoveWhileDragging);
        document?.removeEventListener("mousemove", renderDragPreview);
        document?.removeEventListener("dragover", onMouseMoveWhileDragging);
        document.body.removeEventListener("drop", onMouseUp);
        document.body.removeEventListener("mouseup", onMouseUp);
        window.removeEventListener("mouseup", onMouseUp);
        if (dragPreviewRef.current) {
          document.body.removeChild(dragPreviewRef.current);
          dragPreviewRef.current = undefined;
        }
      };
    }
  }, [
    isDragging,
    onMouseMoveWhileDragging,
    onMouseUp,
    mouseOutOfCanvasArtBoard,
  ]);
};
