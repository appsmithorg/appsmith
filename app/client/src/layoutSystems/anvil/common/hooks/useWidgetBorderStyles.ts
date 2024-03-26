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

  let boxShadowColor = "transparent";
  if (isFocused) {
    boxShadowColor = Colors.WATUSI;
  }
  if (isSelected) {
    boxShadowColor = "#F86A2B";
  }
  const shouldHideBorder =
    isDragging || isCanvasResizing || isDistributingSpace;
  const canShowBorder = !shouldHideBorder && (isFocused || isSelected);

  return {
    border: `1px solid ${canShowBorder ? Colors.GREY_1 : "transparent"}`,
    outline: `1px solid ${canShowBorder ? Colors.GREY_1 : "transparent"}`,
    outlineOffset: "1px",
    borderRadius: "4px 0px 4px 4px",
    boxShadow: `0px 0px 0px 1px ${
      canShowBorder ? boxShadowColor : "transparent"
    }`,
  };
}
