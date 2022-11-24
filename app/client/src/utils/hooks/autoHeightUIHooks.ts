import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import { useCallback } from "react";
import { useDispatch } from "react-redux";

export const useAutoHeightUIState = () => {
  const dispatch = useDispatch();
  return {
    setIsAutoHeightWithLimitsChanging: useCallback(
      (isAutoHeightWithLimitsChanging: boolean) => {
        dispatch({
          type: ReduxActionTypes.SET_AUTO_HEIGHT_WITH_LIMITS_CHANGING,
          payload: { isAutoHeightWithLimitsChanging },
        });
      },
      [dispatch],
    ),
  };
};
