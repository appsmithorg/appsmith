import { useDispatch } from "react-redux";
import { focusWidget } from "actions/widgetActions";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";

import { useCallback } from "react";

export const useWidgetSelection = () => {
  const dispatch = useDispatch();
  return {
    selectWidget: useCallback(
      (widgetId: string, isMultiSelect?: boolean, selectSiblings?: boolean) => {
        dispatch(
          selectWidgetInitAction(widgetId, isMultiSelect, selectSiblings),
        );
      },
      [dispatch],
    ),
    focusWidget: useCallback(
      (widgetId?: string) => dispatch(focusWidget(widgetId)),
      [dispatch],
    ),
    deselectAll: useCallback(() => dispatch(selectWidgetInitAction([])), [
      dispatch,
    ]),
  };
};
