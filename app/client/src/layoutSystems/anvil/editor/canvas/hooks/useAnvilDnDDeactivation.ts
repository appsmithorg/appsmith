import { useEffect } from "react";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";

/**
 * This hook handles the deactivation of the DnD Listeners while dragging.
 */

export const useAnvilDnDDeactivation = (
  isDragging: boolean,
  isNewWidget: boolean,
) => {
  // Destructuring hook functions for dragging new widgets and setting dragging state
  const { setDraggingNewWidget, setDraggingState } = useWidgetDragResize();

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
      document.body.addEventListener("mouseup", onMouseUp, false);
      window.addEventListener("mouseup", onMouseUp, false);

      // Removing event listeners when the component unmounts or when dragging ends
      return () => {
        document.body.removeEventListener("mouseup", onMouseUp);
        window.removeEventListener("mouseup", onMouseUp);
      };
    }
  }, [isDragging, onMouseUp]);
};
