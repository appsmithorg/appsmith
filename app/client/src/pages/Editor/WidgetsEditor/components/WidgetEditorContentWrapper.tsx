import type { ReactNode } from "react";
import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getIsAutoLayout } from "selectors/editorSelectors";
import { setCanvasSelectionFromEditor } from "actions/canvasSelectionActions";
import { useAllowEditorDragToSelect } from "utils/hooks/useAllowEditorDragToSelect";
import { useAutoHeightUIState } from "utils/hooks/autoHeightUIHooks";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";

export const WidgetEditorContentWrapper = (props: { children: ReactNode }) => {
  const allowDragToSelect = useAllowEditorDragToSelect();
  const { isAutoHeightWithLimitsChanging } = useAutoHeightUIState();
  const dispatch = useDispatch();

  const handleWrapperClick = useCallback(
    (e: any) => {
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
    (e: any) => {
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
  return (
    <div
      className="relative flex flex-row h-full w-full overflow-hidden"
      data-testid="t--widgets-editor"
      draggable
      id="widgets-editor"
      onClick={handleWrapperClick}
      onDragStart={onDragStart}
      style={{
        fontFamily: fontFamily,
        contain: isAutoLayout ? "content" : "strict",
      }}
    >
      {props.children}
    </div>
  );
};
