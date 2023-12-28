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

  return {
    border: `1px solid ${shouldHideBorder ? "transparent" : borderColor}`,
    outline: `1px solid ${
      !shouldHideBorder && (isFocused || isSelected)
        ? Colors.GREY_1
        : "transparent"
    }`,
    borderRadius: "4px 0px 4px 4px",
    boxShadow: `0px 0px 0px 1px ${
      shouldHideBorder ? "transparent" : borderColor
    }`,
  };
}
