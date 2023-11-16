import { fork } from "redux-saga/effects";
import anvilDraggingSagas from "./AnvilDraggingSagas";
import anvilSectionOperationsSagas from "./sections/AnvilSectionOperationSagas";

export default function* anvilSagas() {
  yield fork(anvilDraggingSagas);
  yield fork(anvilSectionOperationsSagas);
}
