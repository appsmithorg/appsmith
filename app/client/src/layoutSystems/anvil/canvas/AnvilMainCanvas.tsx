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
    (event) => {
      clickToClearSelections(event);
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
