import { fork } from "redux-saga/effects";
import anvilDraggingSagas from "./anvilDraggingSagas";
import LayoutElementPositionsSaga from "./LayoutElementPositionsSaga";
import anvilSectionSagas from "./sectionSagas";
import anvilSpaceDistributionSagas from "./anvilSpaceDistributionSagas";

export default function* anvilSagas() {
  yield fork(LayoutElementPositionsSaga);
  yield fork(anvilDraggingSagas);
  yield fork(anvilSectionSagas);
  yield fork(anvilSpaceDistributionSagas);
}
