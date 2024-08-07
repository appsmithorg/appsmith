import { altFocusWidget, focusWidget } from "actions/widgetActions";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";

import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { NavigationMethod } from "utils/history";
import { builderURL } from "ee/RouteBuilder";
import history from "utils/history";

export const useWidgetSelection = () => {
  const dispatch = useDispatch();
  return {
    selectWidget: useCallback(
      (
        type: SelectionRequestType,
        payload?: string[],
        invokedBy?: NavigationMethod,
        basePageId?: string,
      ) => {
        dispatch(selectWidgetInitAction(type, payload, invokedBy, basePageId));
      },
      [dispatch],
    ),
    focusWidget: useCallback(
      (widgetId?: string, altFocus?: boolean) =>
        dispatch(focusWidget(widgetId, altFocus)),
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
    goToWidgetAdd: useCallback(() => history.push(builderURL({})), []),
    altFocus: useCallback((alt: boolean) => {
      dispatch(altFocusWidget(alt));
    }, []),
  };
};
