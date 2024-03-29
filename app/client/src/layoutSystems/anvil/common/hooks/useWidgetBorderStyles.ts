import type { AppState } from "@appsmith/reducers";
import WidgetFactory from "WidgetProvider/factory";
import { getAnvilSpaceDistributionStatus } from "layoutSystems/anvil/integrations/selectors";
import { useSelector } from "react-redux";
import { combinedPreviewModeSelector } from "selectors/editorSelectors";
import { isWidgetFocused, isWidgetSelected } from "selectors/widgetSelectors";

export function useWidgetBorderStyles(widgetId: string, widgetType: string) {
  const isFocused = useSelector(isWidgetFocused(widgetId));
  const isSelected = useSelector(isWidgetSelected(widgetId));
  const onCanvasUI = WidgetFactory.getConfig(widgetType)?.onCanvasUI;
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
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
  if (isFocused) {
    borderColor = `var(${onCanvasUI.selectionBGCSSVar}`;
    borderWidth = "1px";
  }
  if (isSelected) {
    borderColor = `var(${onCanvasUI.selectionBGCSSVar}`;
  }
  const shouldHideBorder =
    isDragging || isCanvasResizing || isDistributingSpace;
  const canShowBorder = !shouldHideBorder && (isFocused || isSelected);

  return {
    outline: `${borderWidth} solid ${
      canShowBorder ? borderColor : "transparent"
    }`,
    outlineOffset: "4px",
  };
}
