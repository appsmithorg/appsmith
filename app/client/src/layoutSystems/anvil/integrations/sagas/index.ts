import { fork } from "redux-saga/effects";
import anvilDraggingSagas from "./anvilDraggingSagas";
import LayoutElementPositionsSaga from "./LayoutElementPositionsSaga";
import anvilSpaceDistributionSagas from "./anvilSpaceDistributionSagas";

export default function* anvilSagas() {
  yield fork(anvilSpaceDistributionSagas);
  yield fork(LayoutElementPositionsSaga);
  yield fork(anvilDraggingSagas);
}
