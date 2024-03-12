import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { AnvilCanvas } from "./AnvilCanvas";
import React, { useCallback, useEffect, useRef } from "react";
import { useCanvasActivation } from "../canvasArenas/hooks/mainCanvas/useCanvasActivation";
import { useSelectWidgetListener } from "../common/hooks/useSelectWidgetListener";
import { useClickToClearSelections } from "./useClickToClearSelections";

/**
 * Anvil Main Canvas is just a wrapper around AnvilCanvas.
 * Why do we need this?
 * Because we need to use useCanvasActivation hook which is only needed to be used once and it is also exclusive to edit mode.
 * checkout useCanvasActivation for more details.
 */

export const AnvilMainCanvas = (props: BaseWidgetProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  /* This is a click event listener to clear selections on clicking outside of the widget */
  const clickToClearSelections = useClickToClearSelections(props.widgetId);

  const handleOnClickCapture = useCallback(
    // We need to make sure to call this only if we're clicking on the main canvas
    // To do this, we'll inspect the event.target to make sure it has the className
    // we would expect only the main canvas to have.
    // Note: This className also exists in the view mode, but this file is rendered only in edit mode.
    (event) => {
      // Get the main canvas identifier (layoutId)
      const mainCanvasIdentifier = props.layout[0]?.layoutId;
      const isTargetMainCanvas = event.target.classList.contains(
        `layout-${mainCanvasIdentifier}`,
      );

      // If we can confirm that the event target is the main canvas, we can clear selections.
      if (isTargetMainCanvas) {
        clickToClearSelections(event);
      }
    },
    [clickToClearSelections],
  );

  useEffect(() => {
    canvasRef.current?.addEventListener("click", handleOnClickCapture);
    return () => {
      canvasRef.current?.removeEventListener("click", handleOnClickCapture);
    };
  }, []);
  /* End of click event listener */

  useCanvasActivation();
  useSelectWidgetListener();
  return <AnvilCanvas {...props} ref={canvasRef} />;
};
