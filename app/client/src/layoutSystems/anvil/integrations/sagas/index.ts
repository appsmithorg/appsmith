import { fork } from "redux-saga/effects";

import LayoutElementPositionsSaga from "./LayoutElementPositionsSaga";
import anvilDraggingSagas from "./anvilDraggingSagas";
import anvilSpaceDistributionSagas from "./anvilSpaceDistributionSagas";
import anvilWidgetAdditionSagas from "./anvilWidgetAdditionSagas";
import anvilWidgetSelectionSaga from "./anvilWidgetSelectionSaga";
import pasteSagas from "./pasteSagas";
import anvilSectionSagas from "./sectionSagas";

export default function* anvilSagas() {
  yield fork(LayoutElementPositionsSaga);
  yield fork(anvilDraggingSagas);
  yield fork(anvilSectionSagas);
  yield fork(anvilSpaceDistributionSagas);
  yield fork(anvilWidgetSelectionSaga);
  yield fork(pasteSagas);
  yield fork(anvilWidgetAdditionSagas);
}
