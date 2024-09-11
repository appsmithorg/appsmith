import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { AppState } from "ee/reducers";
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

export const getIsAutoHeightWithLimitsChanging = (state: AppState) =>
  state.ui.autoHeightUI.isAutoHeightWithLimitsChanging;
