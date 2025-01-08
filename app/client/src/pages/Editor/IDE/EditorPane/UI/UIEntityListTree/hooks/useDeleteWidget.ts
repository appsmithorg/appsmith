import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { WidgetReduxActionTypes } from "ee/constants/ReduxActionConstants";

export const useDeleteWidget = () => {
  const dispatch = useDispatch();

  const handleDelete = useCallback(
    (widgetId: string) => {
      dispatch({
        type: WidgetReduxActionTypes.WIDGET_DELETE,
        payload: {
          widgetId,
        },
      });
    },
    [dispatch],
  );

  return {
    handleDelete,
  };
};
