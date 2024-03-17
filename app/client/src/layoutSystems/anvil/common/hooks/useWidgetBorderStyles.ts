import type { AppState } from "@appsmith/reducers";
import { Colors } from "constants/Colors";
import { getAnvilSpaceDistributionStatus } from "layoutSystems/anvil/integrations/selectors";
import { useSelector } from "react-redux";
import { combinedPreviewModeSelector } from "selectors/editorSelectors";
import {
  isCurrentWidgetFocused,
  isWidgetSelected,
} from "selectors/widgetSelectors";

export function useWidgetBorderStyles(widgetId: string) {
  const isFocused = useSelector(isCurrentWidgetFocused(widgetId));
  const isSelected = useSelector(isWidgetSelected(widgetId));
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
  if (isFocused) {
    borderColor = Colors.WATUSI;
  }
  if (isSelected) {
    borderColor = "#F86A2B";
  }
  const shouldHideBorder =
    isDragging || isCanvasResizing || isDistributingSpace;
  const canShowBorder = !shouldHideBorder && (isFocused || isSelected);

  return {
    border: `2px solid ${canShowBorder ? borderColor : "transparent"}`,
  };
}
