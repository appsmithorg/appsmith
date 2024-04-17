import { getNearestParentCanvas } from "utils/generators";
import { useCanvasDragging } from "./hooks/useCanvasDragging";
import React from "react";
import type {
  AnvilHighlightInfo,
  DraggedWidget,
  HighlightPayload,
} from "layoutSystems/anvil/utils/anvilTypes";
import type { AnvilDnDStates } from "./hooks/useAnvilDnDStates";
import type { LayoutElementPositions } from "layoutSystems/common/types";
import { AnvilDnDListener } from "./AnvilDnDListener";
import { AnvilDnDHighlight } from "./AnvilDnDHighlight";

export interface AnvilHighlightingCanvasProps {
  anvilDragStates: AnvilDnDStates;
  canvasId: string;
  layoutId: string;
  deriveAllHighlightsFn: (
    layoutElementPositions: LayoutElementPositions,
    draggedWidgets: DraggedWidget[],
  ) => HighlightPayload;
  onDrop: (renderedBlock: AnvilHighlightInfo) => void;
}

export function AnvilHighlightingCanvas({
  anvilDragStates,
  canvasId,
  deriveAllHighlightsFn,
  layoutId,
  onDrop,
}: AnvilHighlightingCanvasProps) {
  const slidingArenaRef = React.useRef<HTMLDivElement>(null);
  const stickyCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const [highlightShown, setHighlightShown] =
    React.useState<AnvilHighlightInfo | null>(null);
  // showDraggingCanvas indicates if the current dragging canvas i.e. the html canvas renders
  const { showCanvas: showDraggingCanvas } = useCanvasDragging(
    slidingArenaRef,
    stickyCanvasRef,
    {
      anvilDragStates,
      canvasId,
      deriveAllHighlightsFn,
      layoutId,
      onDrop,
    },
    setHighlightShown,
  );
  const canvasRef = React.useRef({
    stickyCanvasRef,
    slidingArenaRef,
  });
  const { isCurrentDraggedCanvas } = anvilDragStates;
  return showDraggingCanvas ? (
    <>
      {isCurrentDraggedCanvas && (
        <AnvilDnDHighlight
          highlightShown={highlightShown}
          padding={anvilDragStates.isSection ? 16 : 0}
        />
      )}
      <AnvilDnDListener
        canvasId={`canvas-dragging-${layoutId}`}
        canvasPadding={anvilDragStates.isSection ? 16 : 0}
        getRelativeScrollingParent={getNearestParentCanvas}
        ref={canvasRef}
        // increases pixel density of the canvas
        scaleFactor={2}
        shouldObserveIntersection={anvilDragStates.isDragging}
        showCanvas={showDraggingCanvas}
        sliderId={`div-dragarena-${layoutId}`}
      />
    </>
  ) : null;
}
