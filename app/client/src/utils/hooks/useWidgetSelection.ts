import { useDispatch } from "react-redux";
import { focusWidget } from "actions/widgetActions";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";

import { useCallback } from "react";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { NavigationMethod } from "utils/history";

export const useWidgetSelection = () => {
  const dispatch = useDispatch();
  return {
    selectWidget: useCallback(
      (
        type: SelectionRequestType,
        payload?: string[],
        invokedBy?: NavigationMethod,
      ) => {
        dispatch(selectWidgetInitAction(type, payload, invokedBy));
      },
      [dispatch],
    ),
    focusWidget: useCallback(
      (widgetId?: string) => dispatch(focusWidget(widgetId)),
      [dispatch],
    ),
    deselectAll: useCallback(
      () => dispatch(selectWidgetInitAction(SelectionRequestType.Empty)),
      [dispatch],
    ),
  };
};
