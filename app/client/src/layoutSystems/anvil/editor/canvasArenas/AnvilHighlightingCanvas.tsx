import { useAnvilDnDEvents } from "./hooks/useAnvilDnDEvents";
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
  widgetId: string;
  layoutId: string;
  deriveAllHighlightsFn: (
    layoutElementPositions: LayoutElementPositions,
    draggedWidgets: DraggedWidget[],
  ) => HighlightPayload;
  onDrop: (renderedBlock: AnvilHighlightInfo) => void;
}

export function AnvilHighlightingCanvas({
  anvilDragStates,
  deriveAllHighlightsFn,
  layoutId,
  onDrop,
  widgetId,
}: AnvilHighlightingCanvasProps) {
  const anvilDnDListenerRef = React.useRef<HTMLDivElement>(null);
  const [highlightShown, setHighlightShown] =
    React.useState<AnvilHighlightInfo | null>(null);

  const { isCurrentDraggedCanvas } = anvilDragStates;
  // showDraggingCanvas indicates if the current dragging canvas i.e. the html canvas renders
  const { showDnDListener } = useAnvilDnDEvents(
    anvilDnDListenerRef,
    {
      anvilDragStates,
      widgetId,
      deriveAllHighlightsFn,
      layoutId,
      onDrop,
    },
    setHighlightShown,
  );
  return showDnDListener ? (
    <>
      {isCurrentDraggedCanvas && (
        <AnvilDnDHighlight
          compensatorValues={anvilDragStates.widgetCompensatorValues}
          highlightShown={highlightShown}
          zIndex={anvilDragStates.zIndex + 1}
        />
      )}
      <AnvilDnDListener
        compensatorValues={anvilDragStates.widgetCompensatorValues}
        ref={anvilDnDListenerRef}
        zIndex={anvilDragStates.zIndex}
      />
    </>
  ) : null;
}
