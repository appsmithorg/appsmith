import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { DefaultRootState } from "react-redux";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

export const useAutoHeightUIState = () => {
  const dispatch = useDispatch();

  return {
    isAutoHeightWithLimitsChanging: useSelector(
      (state: DefaultRootState) =>
        state.ui.autoHeightUI.isAutoHeightWithLimitsChanging,
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

export const getIsAutoHeightWithLimitsChanging = (state: DefaultRootState) =>
  state.ui.autoHeightUI.isAutoHeightWithLimitsChanging;
