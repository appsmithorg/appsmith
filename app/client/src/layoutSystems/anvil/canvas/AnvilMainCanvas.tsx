import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { AnvilCanvas } from "./AnvilCanvas";
import React from "react";
import { useCanvasActivationStates } from "../canvasArenas/hooks/mainCanvas/useCanvasActivationStates";
import { useCanvasActivation } from "../canvasArenas/hooks/mainCanvas/useCanvasActivation";
import { useSelectWidgetListener } from "../common/hooks/useSelectWidgetListener";
import { useRenderDetachedChildren } from "../common/hooks/detachedWidgetHooks";

export const AnvilMainCanvas = (props: BaseWidgetProps) => {
  const anvilCanvasActivationStates = useCanvasActivationStates();
  useCanvasActivation(anvilCanvasActivationStates);
  const renderDetachedChildren = useRenderDetachedChildren(
    props.widgetId,
    props.children,
  );

  useSelectWidgetListener();
  return (
    <>
      {renderDetachedChildren}
      <AnvilCanvas {...props} />
    </>
  );
};
