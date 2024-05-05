import { setHighlightsDrawnAction } from "layoutSystems/anvil/integrations/actions/draggingActions";
import type {
  AnvilHighlightInfo,
  DraggedWidget,
  HighlightPayload,
} from "layoutSystems/anvil/utils/anvilTypes";
import { throttle } from "lodash";
import { useCallback, useRef } from "react";
import { getPositionCompensatedHighlight } from "../utils/dndCompensatorUtils";
import { useDispatch } from "react-redux";
import {
  getClosestHighlight,
  removeDisallowDroppingsUI,
  renderDisallowDroppingUI,
} from "../utils/utils";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";
import type { AnvilDnDListenerStates } from "./useAnvilDnDListenerStates";
import type { LayoutElementPositions } from "layoutSystems/common/types";

export const useAnvilDnDEventCallbacks = ({
  anvilDnDListenerRef,
  anvilDragStates,
  canvasIsDragging,
  deriveAllHighlightsFn,
  layoutId,
  onDrop,
  setHighlightShown,
}: {
  anvilDragStates: AnvilDnDListenerStates;
  anvilDnDListenerRef: React.RefObject<HTMLDivElement>;
  canvasIsDragging: React.MutableRefObject<boolean>;
  deriveAllHighlightsFn: (
    layoutElementPositions: LayoutElementPositions,
    draggedWidgets: DraggedWidget[],
  ) => HighlightPayload;
  layoutId: string;
  onDrop: (renderedBlock: AnvilHighlightInfo) => void;
  setHighlightShown: (highlight: AnvilHighlightInfo | null) => void;
}) => {
  const {
    activateOverlayWidgetDrop,
    allowToDrop,
    canActivate,
    draggedBlocks,
    edgeCompensatorValues,
    isCurrentDraggedCanvas,
    isDragging,
    layoutCompensatorValues,
    layoutElementPositions,
  } = anvilDragStates;
  const allHighlightsRef = useRef([] as AnvilHighlightInfo[]);
  const currentSelectedHighlight = useRef<AnvilHighlightInfo | null>(null);
  const dispatch = useDispatch();
  const { setDraggingCanvas } = useWidgetDragResize();
  const calculateHighlights = useCallback(() => {
    if (activateOverlayWidgetDrop) {
      allHighlightsRef.current = [];
    } else {
      allHighlightsRef.current = deriveAllHighlightsFn(
        layoutElementPositions,
        draggedBlocks,
      )?.highlights;
    }
  }, [
    activateOverlayWidgetDrop,
    deriveAllHighlightsFn,
    draggedBlocks,
    layoutElementPositions,
  ]);
  const resetCanvasState = useCallback(() => {
    // Resetting the dnd listener state when necessary
    if (anvilDnDListenerRef.current) {
      removeDisallowDroppingsUI(anvilDnDListenerRef.current);
    }
    canvasIsDragging.current = false;
    dispatch(setHighlightsDrawnAction());
    setHighlightShown(null);
    currentSelectedHighlight.current = null;
  }, [dispatch, setHighlightShown]);
  const onMouseUp = useCallback(() => {
    if (
      isDragging &&
      isCurrentDraggedCanvas &&
      canvasIsDragging.current &&
      currentSelectedHighlight.current &&
      !currentSelectedHighlight.current.existingPositionHighlight &&
      allowToDrop
    ) {
      // Invoke onDrop callback with the appropriate highlight info
      onDrop(currentSelectedHighlight.current);
    }
    resetCanvasState();
  }, [
    allowToDrop,
    isDragging,
    isCurrentDraggedCanvas,
    onDrop,
    resetCanvasState,
  ]);

  const getHighlightCompensator = useCallback(
    (highlight: AnvilHighlightInfo) =>
      getPositionCompensatedHighlight(
        highlight,
        layoutCompensatorValues,
        edgeCompensatorValues,
      ),
    [layoutCompensatorValues, edgeCompensatorValues],
  );
  // make sure rendering highlights on dnd listener and highlighting cell happens once every 50ms
  const throttledSetHighlight = useCallback(
    throttle(
      () => {
        if (
          canvasIsDragging.current &&
          isCurrentDraggedCanvas &&
          currentSelectedHighlight.current
        ) {
          const compensatedHighlight = getHighlightCompensator(
            currentSelectedHighlight.current,
          );
          dispatch(setHighlightsDrawnAction(compensatedHighlight));
          setHighlightShown(compensatedHighlight);
        }
      },
      50,
      {
        leading: true,
        trailing: true,
      },
    ),
    [
      dispatch,
      getHighlightCompensator,
      isCurrentDraggedCanvas,
      setHighlightShown,
    ],
  );

  const onMouseOver = useCallback(
    (e: any) => {
      if (canActivate) {
        setDraggingCanvas(layoutId);
        e.stopPropagation();
      }
    },
    [canActivate, layoutId, setDraggingCanvas],
  );

  const checkForHighlights = useCallback(
    (e: MouseEvent) => {
      if (canvasIsDragging.current) {
        {
          if (anvilDnDListenerRef.current && !allowToDrop) {
            // Render disallow message if dropping is not allowed
            renderDisallowDroppingUI(anvilDnDListenerRef.current);
            return;
          }
          // Get the closest highlight based on the mouse position
          const processedHighlight = getClosestHighlight(
            {
              x: e.offsetX - layoutCompensatorValues.left,
              y: e.offsetY - layoutCompensatorValues.top,
            },
            allHighlightsRef.current,
          );
          if (processedHighlight) {
            currentSelectedHighlight.current = processedHighlight;
            throttledSetHighlight();
          }
        }
      }
    },
    [allowToDrop, layoutCompensatorValues, throttledSetHighlight],
  );

  const onMouseMove = useCallback(
    (e: any) => {
      if (!canActivate) {
        return;
      }
      if (isCurrentDraggedCanvas) {
        // dragging state is set and the canvas is already being used to drag
        if (canvasIsDragging.current) {
          checkForHighlights(e);
        } else {
          // first move after dragging state is set
          calculateHighlights();
          canvasIsDragging.current = true;
          requestAnimationFrame(() => onMouseMove(e));
        }
      } else {
        // first move to set the dragging state
        onMouseOver(e);
      }
    },
    [
      activateOverlayWidgetDrop,
      allowToDrop,
      calculateHighlights,
      canActivate,
      isCurrentDraggedCanvas,
      isDragging,
      layoutCompensatorValues,
      onMouseOver,
      throttledSetHighlight,
    ],
  );

  const onMouseOut = useCallback(() => {
    setDraggingCanvas("");
  }, [setDraggingCanvas]);
  return {
    onMouseMove,
    onMouseOver,
    onMouseOut,
    onMouseUp,
    resetCanvasState,
  };
};
