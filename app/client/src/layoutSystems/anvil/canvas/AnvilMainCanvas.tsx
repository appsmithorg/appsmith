import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { AnvilCanvas } from "./AnvilCanvas";
import React from "react";
import { useCanvasActivationStates } from "../canvasArenas/hooks/mainCanvas/useCanvasActivationStates";
import { useCanvasActivation } from "../canvasArenas/hooks/mainCanvas/useCanvasActivation";

export const AnvilMainCanvas = (props: BaseWidgetProps) => {
  const anvilCanvasActivationStates = useCanvasActivationStates();
  useCanvasActivation(anvilCanvasActivationStates);
  return <AnvilCanvas {...props} />;
};
