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
import { useSelector } from "react-redux";
import { getWidgetByID } from "sagas/selectors";
import { getHighlightCompensationValues } from "./utils/utils";

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
  const widget = useSelector(getWidgetByID(widgetId));
  const highlightCompensatorValues = getHighlightCompensationValues(
    widgetId,
    widget.type,
    layoutId,
    anvilDragStates.mainCanvasLayoutId,
    anvilDragStates.layoutElementPositions,
  );
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
    highlightCompensatorValues,
    setHighlightShown,
  );
  return showDnDListener ? (
    <>
      {isCurrentDraggedCanvas && (
        <AnvilDnDHighlight
          highlightShown={highlightShown}
          padding={
            anvilDragStates.isSection ? highlightCompensatorValues.left : 0
          }
        />
      )}
      <AnvilDnDListener
        paddingLeft={
          anvilDragStates.isSection ? highlightCompensatorValues.left : 0
        }
        ref={anvilDnDListenerRef}
        zIndex={anvilDragStates.isSection ? 0 : 1}
      />
    </>
  ) : null;
}
