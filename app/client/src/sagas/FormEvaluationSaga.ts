import { call, fork, take, select, put } from "redux-saga/effects";
import {
  ReduxAction,
  ReduxActionTypes,
} from "../constants/ReduxActionConstants";
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
const evalQueue: ReduxAction<any>[] = [];

function* setFormEvaluationSagaAsync(action: ReduxAction<any>): any {
  if (isEvaluating) {
    evalQueue.push(action);
    yield;
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
      const nextAction = evalQueue.shift() as ReduxAction<any>;
      yield fork(setFormEvaluationSagaAsync, nextAction);
    }
  }
}

function* formEvaluationChangeListenerSaga() {
  while (true) {
    const action = yield take(FORM_EVALUATION_REDUX_ACTIONS);
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
