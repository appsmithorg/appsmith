import type { LayoutElementPositions } from "layoutSystems/common/types";
import React, { useContext } from "react";
import type {
  DraggedWidget,
  HighlightPayload,
  LayoutComponentTypes,
} from "layoutSystems/anvil/utils/anvilTypes";
import { AnvilHighlightingCanvas } from "./AnvilHighlightingCanvas";
import { useAnvilWidgetDrop } from "./hooks/useAnvilWidgetDrop";
import { DetachedWidgetsDropArena } from "./DetachedWidgetsDropArena";
import { useSelector } from "react-redux";
import { isEditOnlyModeSelector } from "selectors/editorSelectors";
import { useAnvilDnDListenerStates } from "./hooks/useAnvilDnDListenerStates";
import { AnvilDnDStatesContext } from "../canvas/AnvilEditorCanvas";
import type { AnvilGlobalDnDStates } from "../canvas/hooks/useAnvilGlobalDnDStates";

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

const AnvilDraggingArenaComponent = ({
  anvilGlobalDragStates,
  dragArenaProps,
}: {
  dragArenaProps: AnvilCanvasDraggingArenaProps;
  anvilGlobalDragStates: AnvilGlobalDnDStates;
}) => {
  const isEditOnlyMode = useSelector(isEditOnlyModeSelector);
  const {
    allowedWidgetTypes,
    deriveAllHighlightsFn,
    layoutId,
    layoutType,
    widgetId,
  } = dragArenaProps;
  // Fetching all states used in Anvil DnD using the useAnvilDnDStates hook
  const anvilDragStates = useAnvilDnDListenerStates({
    allowedWidgetTypes,
    anvilGlobalDragStates,
    widgetId,
    layoutId,
    layoutType,
  });

  // Using the useAnvilWidgetDrop hook to handle widget dropping
  const onDrop = useAnvilWidgetDrop(widgetId, anvilDragStates);
  const isMainCanvasDropArena =
    anvilGlobalDragStates.mainCanvasLayoutId === layoutId;
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
          anvilGlobalDragStates={anvilGlobalDragStates}
          onDrop={onDrop}
        />
      )}
    </>
  ) : null;
};

export const AnvilDraggingArena = (props: AnvilCanvasDraggingArenaProps) => {
  const anvilGlobalDragStates = useContext(AnvilDnDStatesContext);
  return anvilGlobalDragStates ? (
    <AnvilDraggingArenaComponent
      anvilGlobalDragStates={anvilGlobalDragStates}
      dragArenaProps={props}
    />
  ) : null;
};
