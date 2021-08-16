import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { takeEvery } from "redux-saga/effects";

import { ReplayOperation } from "workers/dslReplay.worker";
import { undoRedoSaga } from "./EvaluationsSaga";

export type UndoRedoPayload = {
  operation: ReplayOperation;
};

export default function* undoRedoListenerSaga() {
  yield takeEvery(ReduxActionTypes.UNDO_REDO_OPERATION, undoRedoSaga);
}
