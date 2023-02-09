import { focusWidget } from "actions/widgetActions";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";

import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";

export const useWidgetSelection = () => {
  const dispatch = useDispatch();
  return {
    selectWidget: useCallback(
      (type: SelectionRequestType, payload?: string[]) => {
        dispatch(selectWidgetInitAction(type, payload));
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
