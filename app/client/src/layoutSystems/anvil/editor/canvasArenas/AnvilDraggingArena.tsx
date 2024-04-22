import type { LayoutElementPositions } from "layoutSystems/common/types";
import React from "react";
import type {
  DraggedWidget,
  HighlightPayload,
  LayoutComponentTypes,
} from "layoutSystems/anvil/utils/anvilTypes";
import { AnvilHighlightingCanvas } from "./AnvilHighlightingCanvas";
import { useAnvilDnDStates } from "./hooks/useAnvilDnDStates";
import { useAnvilWidgetDrop } from "./hooks/useAnvilWidgetDrop";
import { DetachedWidgetsDropArena } from "./DetachedWidgetsDropArena";
import { useSelector } from "react-redux";
import { isEditOnlyModeSelector } from "selectors/editorSelectors";

// Props interface for AnvilCanvasDraggingArena component
interface AnvilCanvasDraggingArenaProps {
  widgetId: string;
  layoutId: string;
  layoutType: LayoutComponentTypes;
  allowedWidgetTypes: string[];
  deriveAllHighlightsFn: (
    layoutElementPositions: LayoutElementPositions,
    draggedWidgets: DraggedWidget[],
  ) => HighlightPayload;
}

export const AnvilDraggingArena = (props: AnvilCanvasDraggingArenaProps) => {
  const isEditOnlyMode = useSelector(isEditOnlyModeSelector);
  const {
    allowedWidgetTypes,
    deriveAllHighlightsFn,
    layoutId,
    layoutType,
    widgetId,
  } = props;

  // Fetching all states used in Anvil DnD using the useAnvilDnDStates hook
  const anvilDragStates = useAnvilDnDStates({
    allowedWidgetTypes,
    widgetId,
    layoutId,
    layoutType,
  });

  // Using the useAnvilWidgetDrop hook to handle widget dropping
  const onDrop = useAnvilWidgetDrop(widgetId, anvilDragStates);
  const isMainCanvasDropArena =
    anvilDragStates.mainCanvasLayoutId === props.layoutId;
  return isEditOnlyMode ? (
    <>
      <AnvilHighlightingCanvas
        anvilDragStates={anvilDragStates}
        deriveAllHighlightsFn={deriveAllHighlightsFn}
        layoutId={layoutId}
        onDrop={onDrop}
        widgetId={widgetId}
      />
      {isMainCanvasDropArena && (
        <DetachedWidgetsDropArena
          anvilDragStates={anvilDragStates}
          onDrop={onDrop}
        />
      )}
    </>
  ) : null;
};
