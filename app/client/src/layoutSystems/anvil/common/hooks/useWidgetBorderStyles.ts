import type { AppState } from "@appsmith/reducers";
import WidgetFactory from "WidgetProvider/factory";
import {
  getAnvilHighlightShown,
  getAnvilSpaceDistributionStatus,
} from "layoutSystems/anvil/integrations/selectors";
import { useSelector } from "react-redux";
import { combinedPreviewModeSelector } from "selectors/editorSelectors";
import { isWidgetFocused, isWidgetSelected } from "selectors/widgetSelectors";

export function useWidgetBorderStyles(widgetId: string, widgetType: string) {
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
  const highlightShown = useSelector(getAnvilHighlightShown);
  const showDraggedOnBorder =
    highlightShown && highlightShown.canvasId === widgetId;
  const isFocused = useSelector(isWidgetFocused(widgetId));
  const isSelected = useSelector(isWidgetSelected(widgetId));
  const onCanvasUI = WidgetFactory.getConfig(widgetType)?.onCanvasUI;
  const isCanvasResizing: boolean = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isAutoCanvasResizing,
  );
  const isDistributingSpace: boolean = useSelector(
    getAnvilSpaceDistributionStatus,
  );

  const isPreviewMode = useSelector(combinedPreviewModeSelector);
  if (isPreviewMode) {
    return {};
  }

  let borderColor = "transparent";
  let borderWidth = "2px";
  if (isFocused || showDraggedOnBorder) {
    borderColor = `var(${onCanvasUI.selectionBGCSSVar})`;
    borderWidth = "1px";
  }
  if (isSelected) {
    borderColor = `var(${onCanvasUI.selectionBGCSSVar})`;
    borderWidth = "2px";
  }
  const shouldHideBorder =
    isCanvasResizing || isDistributingSpace || isDragging;
  const canShowBorder =
    showDraggedOnBorder || (!shouldHideBorder && (isFocused || isSelected));
  const borderStyle = showDraggedOnBorder ? "dashed" : "solid";
  return {
    outline: `${borderWidth} ${borderStyle} ${
      canShowBorder ? borderColor : "transparent"
    }`,
    outlineOffset: "3px",
  };
}
