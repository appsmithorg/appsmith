import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { all, takeLatest, select, put } from "redux-saga/effects";
import { getActiveTourIndex, getActiveTourType } from "selectors/tourSelectors";
import { setActiveTourIndex, resetActiveTour } from "actions/tourActions";
import TourSteps from "constants/TourSteps";
import { TourType } from "entities/Tour";

function* proceedToNextTourStep() {
  const currentStep: number = yield select(getActiveTourIndex);
  const activeTourType: TourType | undefined = yield select(getActiveTourType);
  if (!activeTourType) return;

  const activeTourSteps = TourSteps[activeTourType];

  if (!activeTourSteps) return;

  const lengthOfTour = activeTourSteps.length;
  if (lengthOfTour - 1 === currentStep) {
    yield put(resetActiveTour());
  } else {
    yield put(setActiveTourIndex(currentStep + 1));
  }
}

export default function* themeSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.PROCEED_TO_NEXT_TOUR_STEP,
      proceedToNextTourStep,
    ),
  ]);
}
