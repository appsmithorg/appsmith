import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

export const useSwitchToWidget = () => {
  const dispatch = useDispatch();

  const switchToWidget = useCallback(
    (widgetId: string) => {
      dispatch({
        type: ReduxActionTypes.SELECT_WIDGET,
        payload: { widgetId },
      });
    },
    [dispatch],
  );

  return switchToWidget;
};
