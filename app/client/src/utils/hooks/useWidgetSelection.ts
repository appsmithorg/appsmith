import { focusWidget } from "actions/widgetActions";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";

import { useCallback } from "react";
import { useDispatch } from "react-redux";
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
        pageId?: string,
      ) => {
        dispatch(selectWidgetInitAction(type, payload, invokedBy, pageId));
      },
      [dispatch],
    ),
    focusWidget: useCallback(
      (widgetId?: string) => dispatch(focusWidget(widgetId)),
      [dispatch],
    ),
    deselectAll: useCallback(
      () =>
        dispatch(
          selectWidgetInitAction(
            SelectionRequestType.Empty,
            [],
            NavigationMethod.CanvasClick,
          ),
        ),
      [dispatch],
    ),
  };
};
