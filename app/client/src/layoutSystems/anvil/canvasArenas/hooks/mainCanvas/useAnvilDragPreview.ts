import { useEffect, useRef } from "react";
import { AnvilCanvasZIndex } from "./useCanvasActivation";
import type { DragDetails } from "reducers/uiReducers/dragResizeReducer";

const createNewWidgetPreview = (widgetType: string): HTMLDivElement => {
  const type = `${widgetType.split("_").join("").toLowerCase()}`;
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

interface AnvilDragPreviewProps {
  isDragging: boolean;
  isNewWidget: boolean;
  dragDetails: DragDetails;
}

export const useAnvilDragPreview = ({
  dragDetails,
  isDragging,
  isNewWidget,
}: AnvilDragPreviewProps) => {
  const dragPreviewRef = useRef<HTMLDivElement>();

  const renderDragPreview = (e: MouseEvent) => {
    if (isDragging && dragPreviewRef.current) {
      dragPreviewRef.current.style.left = `${e.clientX}px`;
      dragPreviewRef.current.style.top = `${e.clientY}px`;
      if (dragPreviewRef.current.style.zIndex !== AnvilCanvasZIndex.activated) {
        dragPreviewRef.current.style.zIndex = AnvilCanvasZIndex.activated;
      }
    }
  };
  useEffect(() => {
    if (isDragging) {
      if (!dragPreviewRef.current) {
        dragPreviewRef.current = isNewWidget
          ? createNewWidgetPreview(dragDetails.newWidget.type)
          : createNewWidgetPreview(
              dragDetails.draggingGroupCenter?.widgetType || "",
            );
        document.body.appendChild(dragPreviewRef.current);
      }
      document?.addEventListener("mousemove", renderDragPreview);
    }
    // Removing event listeners when the component unmounts or when dragging ends
    return () => {
      if (!isDragging) {
        document?.removeEventListener("mousemove", renderDragPreview);
        if (dragPreviewRef.current) {
          document.body.removeChild(dragPreviewRef.current);
          dragPreviewRef.current = undefined;
        }
      }
    };
  }, [isDragging, renderDragPreview]);
};
