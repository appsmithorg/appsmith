import { useDispatch } from "react-redux";
import { focusWidget } from "actions/widgetActions";
import {
  selectMultipleWidgetsInitAction,
  selectWidgetInitAction,
  shiftSelectWidgetsEntityExplorerInitAction,
} from "actions/widgetSelectionActions";

import { useCallback } from "react";

export const useWidgetSelection = () => {
  const dispatch = useDispatch();
  return {
    selectWidget: useCallback(
      (widgetId?: string, isMultiSelect?: boolean) => {
        debugger;
        dispatch(selectWidgetInitAction(widgetId, isMultiSelect));
      },
      [dispatch],
    ),
    shiftSelectWidgetEntityExplorer: useCallback(
      (widgetId: string, siblingWidgets: string[]) => {
        dispatch(
          shiftSelectWidgetsEntityExplorerInitAction(widgetId, siblingWidgets),
        );
      },
      [dispatch],
    ),
    focusWidget: useCallback(
      (widgetId?: string) => dispatch(focusWidget(widgetId)),
      [dispatch],
    ),
    deselectAll: useCallback(
      () => dispatch(selectMultipleWidgetsInitAction([])),
      [dispatch],
    ),
  };
};
