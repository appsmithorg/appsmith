import { fork } from "redux-saga/effects";
import anvilDraggingSagas from "./anvilDraggingSagas";
import LayoutElementPositionsSaga from "./LayoutElementPositionsSaga";

export default function* anvilSagas() {
  yield fork(LayoutElementPositionsSaga);
  yield fork(anvilDraggingSagas);
}
