import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { AnvilCanvas } from "./AnvilCanvas";
import React from "react";
import { useCanvasActivation } from "../canvasArenas/hooks/mainCanvas/useCanvasActivation";

/**
 * Anvil Main Canvas is just a wrapper around AnvilCanvas.
 * Why do we need this?
 * Because we need to use useCanvasActivation hook which is only needed to be used once and it is also exclusive to edit mode.
 * checkout useCanvasActivation for more details.
 */

export const AnvilMainCanvas = (props: BaseWidgetProps) => {
  useCanvasActivation();
  return <AnvilCanvas {...props} />;
};
