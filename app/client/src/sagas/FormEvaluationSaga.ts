import { call, fork, take, select, put } from "redux-saga/effects";
import {
  ReduxAction,
  ReduxActionTypes,
} from "../constants/ReduxActionConstants";
import log from "loglevel";
import * as Sentry from "@sentry/react";
import { getFormEvaluationState } from "../selectors/formSelectors";
import { evalFormConfig } from "./EvaluationsSaga";
import {
  ConditionalOutput,
  DynamicValues,
  FormEvalOutput,
  FormEvaluationState,
} from "reducers/evaluationReducers/formEvaluationReducer";
import { FORM_EVALUATION_REDUX_ACTIONS } from "actions/evaluationActions";
import { ActionConfig } from "entities/Action";
import { FormConfig } from "components/formControls/BaseControl";
import PluginsApi from "api/PluginApi";

let isEvaluating = false; // Flag to maintain the queue of evals

export type FormEvalActionPayload = {
  formId: string;
  actionConfiguration?: ActionConfig;
  editorConfig?: FormConfig[];
  settingConfig?: FormConfig[];
};

const evalQueue: ReduxAction<FormEvalActionPayload>[] = [];

// Function to set isEvaluating flag
const setIsEvaluating = (newState: boolean) => {
  isEvaluating = newState;
};

// Function to extract all the objects that have to fetch dynamic values
const extractQueueOfValuesToBeFetched = (evalOutput: FormEvalOutput) => {
  let output: Record<string, ConditionalOutput> = {};
  Object.entries(evalOutput).forEach(([key, value]) => {
    if (
      "fetchDynamicValues" in value &&
      !!value.fetchDynamicValues &&
      "allowedToFetch" in value.fetchDynamicValues &&
      value.fetchDynamicValues.allowedToFetch
    ) {
      output = { ...output, [key]: value };
    }
  });
  return output;
};

function* setFormEvaluationSagaAsync(
  action: ReduxAction<FormEvalActionPayload>,
): any {
  // We have to add a queue here because the eval cannot happen before the initial state is set
  if (isEvaluating) {
    evalQueue.push(action);
    yield;
  } else {
    setIsEvaluating(true);
    try {
      // Get current state from redux
      const currentEvalState: FormEvaluationState = yield select(
        getFormEvaluationState,
      );
      // Trigger the worker to compute the new eval state
      const workerResponse = yield call(evalFormConfig, {
        ...action,
        currentEvalState,
      });
      // Update the eval state in redux only if it is not empty
      if (!!workerResponse) {
        yield put({
          type: ReduxActionTypes.SET_FORM_EVALUATION,
          payload: workerResponse,
        });
      }
      setIsEvaluating(false);
      // If there are any actions in the queue, run them
      if (evalQueue.length > 0) {
        const nextAction = evalQueue.shift() as ReduxAction<
          FormEvalActionPayload
        >;
        yield fork(setFormEvaluationSagaAsync, nextAction);
      } else {
        // Once all the actions are done, extract the actions that need to be fetched dynamically
        const formId = action.payload.formId;
        const evalOutput = workerResponse[formId];
        const queueOfValuesToBeFetched = extractQueueOfValuesToBeFetched(
          evalOutput,
        );
        // Pass the queue to the saga to fetch the dynamic values
        yield call(
          fetchDynamicValuesSaga,
          queueOfValuesToBeFetched,
          formId,
          evalOutput,
        );
      }
    } catch (e) {
      log.error(e);
      setIsEvaluating(false);
    }
  }
}

// Function to fetch the dynamic values one by one from the queue
function* fetchDynamicValuesSaga(
  queueOfValuesToBeFetched: Record<string, ConditionalOutput>,
  formId: string,
  evalOutput: FormEvalOutput,
) {
  for (const key of Object.keys(queueOfValuesToBeFetched)) {
    evalOutput = yield call(
      fetchDynamicValueSaga,
      queueOfValuesToBeFetched[key],
      key,
      evalOutput,
    );
  }
  // Set the values to the state once all values are fetched
  yield put({
    type: ReduxActionTypes.SET_FORM_EVALUATION,
    payload: { [formId]: evalOutput },
  });
}

function* fetchDynamicValueSaga(
  value: ConditionalOutput,
  key: string,
  evalOutput: FormEvalOutput,
) {
  try {
    const { config } = value.fetchDynamicValues as DynamicValues;
    const { url } = config;

    (evalOutput[key].fetchDynamicValues as DynamicValues).hasStarted = true;

    // Call the API to fetch the dynamic values
    const response = yield call(PluginsApi.fetchDynamicFormValues, url);
    (evalOutput[key].fetchDynamicValues as DynamicValues).isLoading = false;
    if (!!response && response instanceof Array) {
      (evalOutput[key].fetchDynamicValues as DynamicValues).data = response;
      (evalOutput[key]
        .fetchDynamicValues as DynamicValues).hasFetchFailed = false;
    } else {
      (evalOutput[key]
        .fetchDynamicValues as DynamicValues).hasFetchFailed = true;
      (evalOutput[key].fetchDynamicValues as DynamicValues).data = [];
    }
  } catch (e) {
    log.error(e);
    (evalOutput[key].fetchDynamicValues as DynamicValues).hasFetchFailed = true;
    (evalOutput[key].fetchDynamicValues as DynamicValues).isLoading = false;
    (evalOutput[key].fetchDynamicValues as DynamicValues).data = [];
  }
  return evalOutput;
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
