import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import { AppState } from "ce/reducers";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

export const useAutoHeightUIState = () => {
  const dispatch = useDispatch();
  return {
    isAutoHeightWithLimitsChanging: useSelector(
      (state: AppState) => state.ui.autoHeightUI.isAutoHeightWithLimitsChanging,
    ),
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
