import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { TourType } from "entities/Tour";

const initialState: TourReducerState = {
  isTourInProgress: false,
  activeTourIndex: -1,
  activeTourType: undefined,
};

const tourReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_ACTIVE_TOUR]: (
    state: TourReducerState,
    action: ReduxAction<TourType>,
  ) => ({
    ...state,
    activeTourType: action.payload,
    activeTourIndex: 0,
  }),
  [ReduxActionTypes.RESET_ACTIVE_TOUR]: (state: TourReducerState) => ({
    ...state,
    activeTourType: undefined,
    activeTourIndex: -1,
  }),
  [ReduxActionTypes.SET_ACTIVE_TOUR_INDEX]: (
    state: TourReducerState,
    action: ReduxAction<number>,
  ) => ({
    ...state,
    activeTourIndex: action.payload,
  }),
});

import type { TourReducerState } from "./tourReducer.types";

export default tourReducer;
