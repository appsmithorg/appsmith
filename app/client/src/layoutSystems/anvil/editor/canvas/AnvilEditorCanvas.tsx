import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { AnvilViewerCanvas } from "layoutSystems/anvil/viewer/canvas/AnvilViewerCanvas";
import React, { useCallback, useEffect, useRef } from "react";
import { useSelectWidgetListener } from "./hooks/useSelectWidgetListener";
import { useClickToClearSelections } from "./hooks/useClickToClearSelections";
import type { AnvilGlobalDnDStates } from "./hooks/useAnvilGlobalDnDStates";
import { useAnvilGlobalDnDStates } from "./hooks/useAnvilGlobalDnDStates";
import { AnvilDragPreview } from "../canvasArenas/AnvilDragPreview";
import { AnvilWidgetElevationProvider } from "./providers/AnvilWidgetElevationProvider";
import { AnalyticsWrapper } from "../../../common/AnalyticsWrapper";

export const AnvilDnDStatesContext = React.createContext<
  AnvilGlobalDnDStates | undefined
>(undefined);
/**
 * Anvil Main Canvas is just a wrapper around AnvilCanvas.
 * Why do we need this?
 * Because we need to use useCanvasActivation hook which is only needed to be used once and it is also exclusive to edit mode.
 * checkout useCanvasActivation for more details.
 */
export const AnvilEditorCanvas = (props: BaseWidgetProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  /* This is a click event listener to clear selections on clicking outside of the widget */
  const clickToClearSelections = useClickToClearSelections(props.widgetId);

  const handleOnClickCapture = useCallback(
    // We need to make sure to call this only if we're clicking on the main canvas
    // To do this, we'll inspect the event.target to make sure it has the className
    // we would expect only the main canvas to have.
    // Note: This className also exists in the view mode, but this file is rendered only in edit mode.
    (event) => {
      // Get the main canvas identifier (layoutId)
      const mainCanvasIdentifier = props.layout[0]?.layoutId;
      const isTargetMainCanvas = event.target.classList.contains(
        `layout-${mainCanvasIdentifier}`,
      );

      // If we can confirm that the event target is the main canvas, we can clear selections.
      if (isTargetMainCanvas) {
        clickToClearSelections(event);
      }
    },
    [clickToClearSelections],
  );

  useEffect(() => {
    canvasRef.current?.addEventListener("click", handleOnClickCapture);

    return () => {
      canvasRef.current?.removeEventListener("click", handleOnClickCapture);
    };
  }, []);
  /* End of click event listener */

  useSelectWidgetListener();
  // Fetching all states used in Anvil DnD using the useAnvilGlobalDnDStates hook
  // using AnvilDnDStatesContext to provide the states to the child AnvilDraggingArena
  const anvilGlobalDnDStates = useAnvilGlobalDnDStates();

  return (
    <AnvilWidgetElevationProvider>
      <AnvilDnDStatesContext.Provider value={anvilGlobalDnDStates}>
        <AnalyticsWrapper>
          <AnvilViewerCanvas {...props} ref={canvasRef} />
        </AnalyticsWrapper>
        <AnvilDragPreview
          dragDetails={anvilGlobalDnDStates.dragDetails}
          draggedBlocks={anvilGlobalDnDStates.draggedBlocks}
          isDragging={anvilGlobalDnDStates.isDragging}
          isNewWidget={anvilGlobalDnDStates.isNewWidget}
        />
      </AnvilDnDStatesContext.Provider>
    </AnvilWidgetElevationProvider>
  );
};
