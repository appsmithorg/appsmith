import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { TourType } from "entities/Tour";

export const setActiveTour = (tourType: TourType) => ({
  type: ReduxActionTypes.SET_ACTIVE_TOUR,
  payload: tourType,
});

export const resetActiveTour = () => ({
  type: ReduxActionTypes.RESET_ACTIVE_TOUR,
  payload: undefined,
});

export const setActiveTourIndex = (index: number) => ({
  type: ReduxActionTypes.SET_ACTIVE_TOUR_INDEX,
  payload: index,
});

export const proceedToNextTourStep = () => ({
  type: ReduxActionTypes.PROCEED_TO_NEXT_TOUR_STEP,
  payload: undefined,
});
