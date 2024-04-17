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
import { getWidgetHierarchy } from "layoutSystems/anvil/utils/paste/utils";
import { useSelector } from "react-redux";
import { getWidgetByID } from "sagas/selectors";

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
  const anvilDnDListenerRef = React.useRef<HTMLDivElement>(null);
  const [highlightShown, setHighlightShown] =
    React.useState<AnvilHighlightInfo | null>(null);
  // showDraggingCanvas indicates if the current dragging canvas i.e. the html canvas renders
  const { showCanvas: showDraggingCanvas } = useCanvasDragging(
    anvilDnDListenerRef,
    {
      anvilDragStates,
      canvasId,
      deriveAllHighlightsFn,
      layoutId,
      onDrop,
    },
    setHighlightShown,
  );
  const { isCurrentDraggedCanvas } = anvilDragStates;
  const widget = useSelector(getWidgetByID(canvasId));
  const hierarchy = getWidgetHierarchy(widget.type, canvasId);
  return showDraggingCanvas ? (
    <>
      {isCurrentDraggedCanvas && (
        <AnvilDnDHighlight
          highlightShown={highlightShown}
          padding={anvilDragStates.isSection ? 16 : 0}
        />
      )}
      <AnvilDnDListener
        paddingLeft={anvilDragStates.isSection ? 16 : 0}
        paddingTop={0}
        ref={anvilDnDListenerRef}
        zIndex={hierarchy === 2 ? 0 : 1}
      />
    </>
  ) : null;
}
