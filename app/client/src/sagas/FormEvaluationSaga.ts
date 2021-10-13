import { call, fork, put, select, take } from "redux-saga/effects";
import { ReduxActionTypes } from "../constants/ReduxActionConstants";
import log from "loglevel";
import * as Sentry from "@sentry/react";
import { getFormEvaluationState } from "../selectors/formSelectors";
import { FormEvaluationState } from "../reducers/evaluationReducers/formEvaluationReducer";

// All the topics this saga refers to
const FORM_EVALUATION_REDUX_ACTIONS = [
  ReduxActionTypes.INIT_FORM_EVALUATION,
  ReduxActionTypes.RUN_FORM_EVALUATION,
];

export enum ConditionType {
  HIDE = "hide", // When set, the component will be shown until condition is true
  SHOW = "show", // When set, the component will be hidden until condition is true
}

// Object to hold the initial eval object
let finalEvalObj: { [x: string]: { visible: boolean; conditionals: any } };

// Recursive function to generate the evaluation state for form config
const generateInitialEvalState = (formConfig: any) => {
  const visible = false;

  // Any element is only added to the eval state if they have a conditional statement present, if not they are allowed to be rendered
  if (formConfig.hasOwnProperty("conditionals")) {
    let key = "unknowns";

    // A unique key is used to refer the object in the eval state, can be propertyName, configProperty or identifier
    if (formConfig.hasOwnProperty("propertyName")) {
      key = formConfig.propertyName;
    } else if (formConfig.hasOwnProperty("configProperty")) {
      key = formConfig.configProperty;
    } else if (formConfig.hasOwnProperty("identifier")) {
      key = formConfig.identifier;
    }

    // Conditionals are stored in the eval state itself for quick access
    finalEvalObj[key] = {
      visible,
      conditionals: formConfig.conditionals,
    };
  }

  if (formConfig.children)
    formConfig.children.forEach((config: any) =>
      generateInitialEvalState(config),
    );
};

// Generator function to run the eval for the whole form when data changes
function* evaluate(
  actionConfiguration: any,
  currentEvalState: FormEvaluationState,
) {
  Object.keys(currentEvalState).forEach((key: string) => {
    try {
      if (currentEvalState[key].hasOwnProperty("conditionals")) {
        const conditionBlock = currentEvalState[key].conditionals;
        Object.keys(conditionBlock).forEach((conditionType) => {
          const output = eval(conditionBlock[conditionType]);
          if (conditionType === ConditionType.HIDE) {
            currentEvalState[key].visible = !output;
          } else if (conditionType === ConditionType.SHOW) {
            currentEvalState[key].visible = output;
          }
        });
      }
    } catch (e) {
      log.error(e);
      Sentry.captureException(e);
    }
  });
  return currentEvalState;
}

// Fetches current evaluation and runs a new one based on the new data
function* getFormEvaluation(formId: string, actionConfiguration: any): any {
  const currentEvalState: any = yield select(getFormEvaluationState);

  // Only change the form evaluation state if the form ID is same or the evaluation state is present
  if (!!currentEvalState && currentEvalState.hasOwnProperty(formId)) {
    currentEvalState[formId] = yield call(
      evaluate,
      actionConfiguration,
      currentEvalState[formId],
    );

    yield put({
      type: ReduxActionTypes.SET_FORM_EVALUATION,
      payload: currentEvalState,
    });
  }
}

// Filter function to assign a function to the Action dispatched
function* setFormEvaluationSaga(type: string, payload: any) {
  if (type === ReduxActionTypes.INIT_FORM_EVALUATION) {
    finalEvalObj = {};
    if (
      "editorConfig" in payload &&
      !!payload.editorConfig &&
      payload.editorConfig.length > 0
    ) {
      payload.editorConfig.forEach((config: any) => {
        generateInitialEvalState(config);
      });
    }
    if (
      "settingConfig" in payload &&
      !!payload.settingConfig &&
      payload.settingConfig.length > 0
    ) {
      payload.settingConfig.forEach((config: any) => {
        generateInitialEvalState(config);
      });
    }
    yield put({
      type: ReduxActionTypes.SET_FORM_EVALUATION,
      payload: {
        [payload.formId]: finalEvalObj,
      },
    });
    return;
  } else {
    const { actionConfiguration, formId } = payload;
    if (!actionConfiguration.formData) {
      yield;
    } else {
      yield call(getFormEvaluation, formId, actionConfiguration);
    }
  }
}

function* formEvaluationChangeListenerSaga() {
  while (true) {
    const action = yield take(FORM_EVALUATION_REDUX_ACTIONS);
    yield fork(setFormEvaluationSaga, action.type, action.payload);
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
