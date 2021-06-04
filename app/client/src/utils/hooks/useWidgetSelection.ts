import { useDispatch } from "react-redux";
import {
  focusWidget,
  selectAllWidgetsAction,
  selectWidgetInitAction,
} from "actions/widgetActions";
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
    focusWidget: useCallback(
      (widgetId?: string) => dispatch(focusWidget(widgetId)),
      [dispatch],
    ),
    deselectAll: useCallback(() => dispatch(selectAllWidgetsAction([])), [
      dispatch,
    ]),
  };
};
