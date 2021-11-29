import { call, fork, take, select, put } from "redux-saga/effects";
import { ReduxActionTypes } from "../constants/ReduxActionConstants";
import log from "loglevel";
import { EVAL_WORKER_ACTIONS } from "utils/DynamicBindingUtils";
import { GracefulWorkerService } from "utils/WorkerUtil";
import Worker from "worker-loader!../workers/evaluation.worker";
import * as Sentry from "@sentry/react";
import { getFormEvaluationState } from "../selectors/formSelectors";

const worker = new GracefulWorkerService(Worker);

// All the topics this saga refers to
const FORM_EVALUATION_REDUX_ACTIONS = [
  ReduxActionTypes.INIT_FORM_EVALUATION,
  ReduxActionTypes.RUN_FORM_EVALUATION,
];

let isEvaluating = false;
const evalQueue: any[] = [];

export function* setFormEvaluationSagaAsync(action: any): any {
  if (isEvaluating) {
    evalQueue.push(action);
    return;
  } else {
    isEvaluating = true;
    yield call(worker.shutdown);
    yield call(worker.start);
    const currentEvalState = yield select(getFormEvaluationState);
    const workerResponse = yield call(
      worker.request,
      EVAL_WORKER_ACTIONS.INIT_FORM_EVAL,
      { ...action, currentEvalState },
    );

    if (!!workerResponse) {
      yield put({
        type: ReduxActionTypes.SET_FORM_EVALUATION,
        payload: workerResponse,
      });
    }
    isEvaluating = false;
    if (evalQueue.length > 0) {
      const nextAction = evalQueue.shift();
      yield fork(setFormEvaluationSagaAsync, nextAction);
    }
    return true;
  }
}

function* formEvaluationChangeListenerSaga() {
  while (true) {
    const action = yield take(FORM_EVALUATION_REDUX_ACTIONS);
    // yield fork(setFormEvaluationSaga, action.type, action.payload);
    yield fork(setFormEvaluationSagaAsync, action);
  }
}

export default function* formEvaluationChangeListener() {
  yield take(ReduxActionTypes.START_EVALUATION);
  while (true) {
    try {
      yield call(formEvaluationChangeListenerSaga);
    } catch (e) {
      log.error(e);
      Sentry.captureException(e);
    }
  }
}
