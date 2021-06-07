import { useDispatch } from "react-redux";
import { focusWidget } from "actions/widgetActions";
import {
  selectAllWidgetsAction,
  selectWidgetInitAction,
  shiftSelectWidgetsInitAction,
} from "actions/widgetSelectionActions";

import { useCallback } from "react";

export const useWidgetSelection = () => {
  const dispatch = useDispatch();
  return {
    selectWidget: useCallback(
      (widgetId?: string, isMultiSelect?: boolean) => {
        dispatch(selectWidgetInitAction(widgetId, isMultiSelect));
      },
      [dispatch],
    ),
    shiftSelectWidget: useCallback(
      (widgetId: string, siblingWidgets: string[]) => {
        dispatch(shiftSelectWidgetsInitAction(widgetId, siblingWidgets));
      },
      [dispatch],
    ),
    focusWidget: useCallback(
      (widgetId?: string) => dispatch(focusWidget(widgetId)),
      [dispatch],
    ),
    deselectAll: useCallback(() => dispatch(selectAllWidgetsAction([])), [
      dispatch,
    ]),
  };
};
