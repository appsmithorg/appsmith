import React, { type ReactNode, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  combinedPreviewModeSelector,
  getIsAutoLayout,
} from "selectors/editorSelectors";
import { setCanvasSelectionFromEditor } from "actions/canvasSelectionActions";
import { useAllowEditorDragToSelect } from "utils/hooks/useAllowEditorDragToSelect";
import { useAutoHeightUIState } from "utils/hooks/autoHeightUIHooks";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";

export const WidgetEditorContentWrapper = (props: { children: ReactNode }) => {
  const allowDragToSelect = useAllowEditorDragToSelect();
  const { isAutoHeightWithLimitsChanging } = useAutoHeightUIState();
  const dispatch = useDispatch();
  const isCombinedPreviewMode = useSelector(combinedPreviewModeSelector);

  const handleWrapperClick = useCallback(
    (e) => {
      // This is a hack for widget name component clicks on Canvas.
      // For some reason the stopPropagation in the konva event listener isn't working
      // Also, the nodeName is available only for the konva event, so standard type definition
      // for onClick handlers don't work. Hence leaving the event type as any.
      const isCanvasWrapperClicked = e.target?.nodeName === "CANVAS";

      // Making sure that we don't deselect the widget
      // after we are done dragging the limits in auto height with limits
      if (
        allowDragToSelect &&
        !isAutoHeightWithLimitsChanging &&
        !isCanvasWrapperClicked
      ) {
        dispatch(setCanvasSelectionFromEditor(false));
      }
    },
    [allowDragToSelect, isAutoHeightWithLimitsChanging],
  );

  /**
   *  drag event handler for selection drawing
   */
  const onDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (allowDragToSelect) {
        const startPoints = {
          x: e.clientX,
          y: e.clientY,
        };

        dispatch(setCanvasSelectionFromEditor(true, startPoints));
      }
    },
    [allowDragToSelect],
  );
  const selectedTheme = useSelector(getSelectedAppTheme);
  const fontFamily = `${selectedTheme.properties.fontFamily.appFont}, sans-serif`;
  const isAutoLayout = useSelector(getIsAutoLayout);
  const wrapperStyle = useMemo(
    () => ({
      fontFamily,
      contain: isAutoLayout ? "content" : "strict",
    }),
    [fontFamily, isAutoLayout],
  );

  return (
    <div
      className="relative flex flex-row h-full w-full overflow-hidden"
      data-testid="t--widgets-editor"
      draggable={!isCombinedPreviewMode}
      id="widgets-editor"
      onClick={handleWrapperClick}
      onDragStart={onDragStart}
      style={wrapperStyle}
    >
      {props.children}
    </div>
  );
};
