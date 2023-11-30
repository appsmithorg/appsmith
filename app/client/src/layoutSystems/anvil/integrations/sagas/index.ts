import { fork } from "redux-saga/effects";
import anvilDraggingSagas from "./AnvilDraggingSagas";
import anvilSectionOperationsSagas from "./sections/AnvilSectionOperationSagas";
import anvilUpdateLayoutSagas from "./UpdateLayoutSagas";
import anvilSpaceDistributionSagas from "./AnvilSpaceDistributionSagas";

export default function* anvilSagas() {
  yield fork(anvilDraggingSagas);
  yield fork(anvilSectionOperationsSagas);
  yield fork(anvilUpdateLayoutSagas);
  yield fork(anvilSpaceDistributionSagas);
}
