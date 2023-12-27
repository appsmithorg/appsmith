import { fork } from "redux-saga/effects";
import anvilDraggingSagas from "./anvilDraggingSagas";
import LayoutElementPositionsSaga from "./LayoutElementPositionsSaga";
import anvilChecksSagas from "./anvilChecksSagas";
import anvilSectionSagas from "./sectionSagas";

export default function* anvilSagas() {
  yield fork(LayoutElementPositionsSaga);
  yield fork(anvilDraggingSagas);
  yield fork(anvilChecksSagas);
  yield fork(anvilSectionSagas);
}
