import { fork } from "redux-saga/effects";
import anvilDraggingSagas from "./anvilDraggingSagas";
import LayoutElementPositionsSaga from "./LayoutElementPositionsSaga";
import anvilSectionSagas from "./sectionSagas";
import anvilSpaceDistributionSagas from "./anvilSpaceDistributionSagas";
import anvilWidgetSelectionSaga from "./anvilWidgetSelectionSaga";
import pasteSagas from "./pasteSagas";
import anvilWidgetAdditionSagas from "./anvilWidgetAdditionSagas";

export default function* anvilSagas() {
  yield fork(LayoutElementPositionsSaga);
  yield fork(anvilDraggingSagas);
  yield fork(anvilSectionSagas);
  yield fork(anvilSpaceDistributionSagas);
  yield fork(anvilWidgetSelectionSaga);
  yield fork(pasteSagas);
  yield fork(anvilWidgetAdditionSagas);
}
