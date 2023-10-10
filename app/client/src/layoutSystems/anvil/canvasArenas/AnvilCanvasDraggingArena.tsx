import React from "react";
import type { RenderedBlockOnCanvas } from "./HighlightingCanvas";
import { HighlightingCanvas } from "./HighlightingCanvas";

type AnvilCanvasDraggingArenaProps = {
  widgetId: string;
};

export const AnvilCanvasDraggingArena = (
  props: AnvilCanvasDraggingArenaProps,
) => {
  const { widgetId } = props;
  const onDrop = (renderedBlock: RenderedBlockOnCanvas) => {
    return renderedBlock;
  };
  const renderOnMouseMove = (e: MouseEvent): RenderedBlockOnCanvas => {
    return {
      xPos: e.clientX,
      yPos: 0,
      width: 0,
      height: 0,
    };
  };
  return (
    <HighlightingCanvas
      onDrop={onDrop}
      renderOnMouseMove={renderOnMouseMove}
      widgetId={widgetId}
    />
  );
};
