import type { AppState } from "ee/reducers";
import WidgetFactory from "WidgetProvider/factory";
import { getWidgetErrorCount } from "layoutSystems/anvil/editor/AnvilWidgetName/selectors";
import {
  getAnvilHighlightShown,
  getAnvilSpaceDistributionStatus,
  getWidgetsDistributingSpace,
} from "layoutSystems/anvil/integrations/selectors";
import { useSelector } from "react-redux";
import { isWidgetFocused, isWidgetSelected } from "selectors/widgetSelectors";
import { selectCombinedPreviewMode } from "selectors/gitModSelectors";

export function useWidgetBorderStyles(widgetId: string, widgetType: string) {
  /** Selectors */
  const isFocused = useSelector(isWidgetFocused(widgetId));
  const isSelected = useSelector(isWidgetSelected(widgetId));
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
  const highlightShown = useSelector(getAnvilHighlightShown);

  const isCanvasResizing: boolean = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isAutoCanvasResizing,
  );

  const showError = useSelector(
    (state) => getWidgetErrorCount(state, widgetId) > 0,
  );
  const isDistributingSpace: boolean = useSelector(
    getAnvilSpaceDistributionStatus,
  );
  const widgetsEffectedBySpaceDistribution = useSelector(
    getWidgetsDistributingSpace,
  );
  const isPreviewMode = useSelector(selectCombinedPreviewMode);

  /** EO selectors */

  // If this is the preview mode, remove all border styles
  if (isPreviewMode) {
    return {};
  }

  const isSectionDistributingSpace =
    widgetsEffectedBySpaceDistribution.section == widgetId;
  // Show the border if the widget has widgets being dragged or redistributed inside it
  const showDraggedOnBorder =
    (highlightShown && highlightShown.canvasId === widgetId) ||
    isSectionDistributingSpace;

  const onCanvasUI = WidgetFactory.getConfig(widgetType)?.onCanvasUI;

  // By default don't show any borders
  let borderColor = "transparent";
  let borderWidth = "var(--on-canvas-ui-border-width-2)";

  // If widget is focused, use the thin borders
  if (isFocused && !isSelected) {
    borderColor = `var(${onCanvasUI.selectionBGCSSVar})`;
    borderWidth = "var(--on-canvas-ui-border-width-1)";
  }

  // If the widget is select default to the thick borders
  if (isSelected) {
    borderColor = `var(${onCanvasUI.selectionBGCSSVar})`;
  }

  // If the widget has widgets being dragged or redistributed inside it
  // Use the thin border
  if (showDraggedOnBorder) {
    borderColor = `var(${onCanvasUI.selectionBGCSSVar})`;
    borderWidth = "var(--on-canvas-ui-border-width-1)";
  }

  // If the widget has an error, use the error color
  if (showError) {
    borderColor = `var(--on-canvas-ui-widget-error)`;
  }

  // Don't show border when resizing the canvas, redistributing space or dragging widgets
  const shouldHideBorder =
    isCanvasResizing || isDistributingSpace || isDragging;
  // Show border if the widget is focused, selected or has widgets being dragged or redistributed inside it
  // Make sure to consider the dragging or canvas resizing, as they should hide the border
  const canShowBorder =
    showDraggedOnBorder || (!shouldHideBorder && (isFocused || isSelected));
  // If the widget has widgets being dragged or distributing in it, show a dashed border
  const borderStyle = showDraggedOnBorder ? "dashed" : "solid";

  return {
    outline: `${borderWidth} ${borderStyle} ${
      canShowBorder ? borderColor : "transparent"
    }`,
    outlineOffset: "var(--on-canvas-ui-outline-offset)",
    borderRadius: "var(--on-canvas-ui-border-radius)",
  };
}
