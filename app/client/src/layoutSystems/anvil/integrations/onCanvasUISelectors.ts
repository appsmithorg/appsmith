import { getAppMode } from "@appsmith/selectors/applicationSelectors";
import { APP_MODE } from "entities/App";
import { createSelector } from "reselect";
import { getIsDragging, getIsResizing } from "selectors/widgetDragSelectors";
import { isWidgetFocused, isWidgetSelected } from "selectors/widgetSelectors";

export const getIsEditorOpen = createSelector(
  getAppMode,
  (appMode?: APP_MODE) => {
    return appMode === APP_MODE.EDIT;
  },
);

export function shouldShowWidgetNameOnWidget(widgetId: string) {
  return createSelector(
    getIsEditorOpen,
    getIsDragging,
    getIsResizing,
    isWidgetSelected(widgetId),
    isWidgetFocused(widgetId),
    (
      isEditorOpen,
      isDragging,
      isResizing,
      isWidgetSelected,
      isWidgetFocused,
    ) => {
      return (
        isEditorOpen &&
        !isDragging &&
        !isResizing &&
        (isWidgetSelected || isWidgetFocused)
      );
    },
  );
}
