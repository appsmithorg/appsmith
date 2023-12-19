import type { AppState } from "@appsmith/reducers";
import { Colors } from "constants/Colors";
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

  let outlinecolor = "transparent";
  if (!isDragging && (isFocused || isSelected)) outlinecolor = Colors.GREY_1;

  return {
    border: `1px solid ${borderColor}`,

    outline: `1px solid ${outlinecolor}`,
    borderRadius: "4px 0px 4px 4px",
    boxShadow: `0px 0px 0px 1px ${
      isDragging || isCanvasResizing ? "transparent" : borderColor
    }`,
  };
}
