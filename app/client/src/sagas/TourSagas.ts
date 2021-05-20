import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { all, takeLatest, select, put } from "redux-saga/effects";
import { getActiveTourIndex, getActiveTourType } from "selectors/tourSelectors";
import { setActiveTourIndex, resetActiveTour } from "actions/tourActions";
import TourSteps from "constants/TourSteps";
import { TourType } from "entities/Tour";

function* proceedToNextTourStep() {
  const currentStep = yield select(getActiveTourIndex);
  const activeTourType = yield select(getActiveTourType);
  const activeTourSteps = TourSteps[activeTourType as TourType];

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
