import { createReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { TourType } from "entities/Tour";

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

export type TourReducerState = {
  isTourInProgress: boolean;
  activeTourType?: TourType;
  activeTourIndex: number;
};

export default tourReducer;
