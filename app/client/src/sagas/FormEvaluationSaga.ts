import { call, fork, take, select, put, race, delay } from "redux-saga/effects";
import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import log from "loglevel";
import * as Sentry from "@sentry/react";
import { getFormEvaluationState } from "selectors/formSelectors";
import { evalFormConfig } from "./EvaluationsSaga";
import {
  ConditionalOutput,
  DynamicValues,
  FormEvaluationState,
} from "reducers/evaluationReducers/formEvaluationReducer";
import { FORM_EVALUATION_REDUX_ACTIONS } from "actions/evaluationActions";
import { Action, ActionConfig } from "entities/Action";
import { FormConfigType } from "components/formControls/BaseControl";
import PluginsApi from "api/PluginApi";
import { ApiResponse } from "api/ApiResponses";
import { getAction } from "selectors/entitiesSelector";
import { getDataTreeActionConfigPath } from "entities/Action/actionProperties";
import { getDataTree } from "selectors/dataTreeSelectors";
import { getDynamicBindings, isDynamicValue } from "utils/DynamicBindingUtils";
import { get, isEmpty } from "lodash";
import { klona } from "klona/lite";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import {
  extractFetchDynamicValueFormConfigs,
  extractQueueOfValuesToBeFetched,
} from "./helper";

let isEvaluating = false; // Flag to maintain the queue of evals

export type FormEvalActionPayload = {
  formId: string;
  datasourceId?: string;
  pluginId?: string;
  actionConfiguration?: ActionConfig;
  editorConfig?: FormConfigType[];
  settingConfig?: FormConfigType[];
  actionDiffPath?: string;
  hasRouteChanged?: boolean;
};

const evalQueue: ReduxAction<FormEvalActionPayload>[] = [];

// This value holds an array of values that needs to be dynamically fetched
// when we run form evaluations we store dynamic values to be fetched in this array
// and when evaluations are finally done, we pick the last dynamic values and call it.
let fetchDynamicValQueue: any = [];

// Function to set isEvaluating flag
const setIsEvaluating = (newState: boolean) => {
  isEvaluating = newState;
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

      if (action?.type === ReduxActionTypes.INIT_FORM_EVALUATION) {
        const fetchDynamicValueFormConfigs = extractFetchDynamicValueFormConfigs(
          workerResponse[action?.payload?.formId],
        );
        yield put({
          type: ReduxActionTypes.INIT_TRIGGER_VALUES,
          payload: {
            [action?.payload?.formId]: klona(fetchDynamicValueFormConfigs),
          },
        });
      }
      // RUN_FORM_EVALUATION shouldn't be called before INIT_FORM_EVALUATION has been called with
      // the same `formId` else `extractQueueOfValuesToBeFetched` will be sent an undefined value.
      if (
        action?.type === ReduxActionTypes.RUN_FORM_EVALUATION &&
        workerResponse[action?.payload?.formId]
      ) {
        const queue = extractQueueOfValuesToBeFetched(
          workerResponse[action?.payload?.formId],
        );
        if (!isEmpty(queue)) {
          fetchDynamicValQueue.push(queue);
        }
      }

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
        if (!!evalOutput && typeof evalOutput === "object") {
          // cloning the queue to prevent mutations in the formEvalutionState
          const queueOfValuesToBeFetched = klona(
            fetchDynamicValQueue[fetchDynamicValQueue.length - 1],
          );

          // whenever there's a queueOfValuesToBeFetched, call fetchDynamicValuesSaga on it.
          if (!!queueOfValuesToBeFetched) {
            yield put({
              type: ReduxActionTypes.FETCH_TRIGGER_VALUES_INIT,
              payload: {
                formId,
                values: queueOfValuesToBeFetched,
              },
            });

            // resetting the fetch dynamic values.
            fetchDynamicValQueue = [];

            // wait for dataTree to be updated with the latest values before fetching dynamic values.
            yield race([
              ReduxActionTypes.SET_LOADING_ENTITIES,
              ReduxActionTypes.SET_EVALUATION_INVERSE_DEPENDENCY_MAP,
            ]);
            // then wait some more just to be sure.
            yield delay(300);

            // Pass the queue to the saga to fetch the dynamic values
            yield call(
              fetchDynamicValuesSaga,
              queueOfValuesToBeFetched,
              formId,
              action.payload.datasourceId ? action.payload.datasourceId : "",
              action.payload.pluginId ? action.payload.pluginId : "",
            );
          }
        }
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
  datasourceId: string,
  pluginId: string,
) {
  for (const key of Object.keys(queueOfValuesToBeFetched)) {
    queueOfValuesToBeFetched[key].fetchDynamicValues = yield call(
      fetchDynamicValueSaga,
      queueOfValuesToBeFetched[key],
      Object.assign(
        {},
        queueOfValuesToBeFetched[key].fetchDynamicValues as DynamicValues,
      ),
      formId,
      datasourceId,
      pluginId,
      key,
    );
  }

  // Set the values to the state once all values are fetched
  yield put({
    type: ReduxActionTypes.FETCH_TRIGGER_VALUES_SUCCESS,
    payload: {
      formId,
      values: queueOfValuesToBeFetched,
    },
  });
}

function* fetchDynamicValueSaga(
  value: ConditionalOutput,
  dynamicFetchedValues: DynamicValues,
  actionId: string,
  datasourceId: string,
  pluginId: string,
  configProperty: string,
) {
  try {
    const {
      config,
      evaluatedConfig,
    } = value.fetchDynamicValues as DynamicValues;
    const { params } = evaluatedConfig;

    dynamicFetchedValues.hasStarted = true;

    let url = PluginsApi.defaultDynamicTriggerURL(datasourceId);

    if (
      "url" in evaluatedConfig &&
      !!evaluatedConfig.url &&
      evaluatedConfig.url.length > 0
    )
      url = evaluatedConfig.url;

    // Eval Action is the current action as it is stored in the dataTree
    let evalAction: any;
    // Evaluated params is the object that will hold the evaluated values of the parameters as computed in the dataTree
    let evaluatedParams;
    // this is a temporary variable, used to derive the evaluated value of the current parameters before being stored in the evaluated params
    let substitutedParameters = {};

    const action: Action = yield select(getAction, actionId);
    const dataTree: DataTree = yield select(getDataTree);

    if (!!action) {
      evalAction = dataTree[action.name];
    }

    // we use the config parameters to get the action diff path value of the parameters i.e. {{actionConfiguration.formData.sheetUrl.data}. Note that it is enclosed within dynamic bindings
    if ("parameters" in config?.params && !!evalAction) {
      Object.entries(config?.params.parameters).forEach(([key, value]) => {
        // we extract the action diff path of the param value from the dynamic binding i.e. actionConfiguration.formData.sheetUrl.data
        const dynamicBindingValue = getDynamicBindings(value as string)
          ?.jsSnippets[0];
        // we convert this action Diff path into the same format as it is stored in the dataTree i.e. config.formData.sheetUrl.data
        const dataTreeActionConfigPath = getDataTreeActionConfigPath(
          dynamicBindingValue,
        );
        // then we get the value of the current parameter from the evaluatedValues in the action object stored in the dataTree.
        const evaluatedValue = get(
          evalAction?.__evaluation__?.evaluatedValues,
          dataTreeActionConfigPath,
        );
        // if it exists, we store it in the substituted params object.
        // we check if that value is enclosed in dynamic bindings i.e the value has not been evaluated or somehow still contains a js expression
        // if it is, we return an empty string since we don't want to send dynamic bindings to the server.
        // if it contains a value, we send the value to the server
        if (!!evaluatedValue) {
          substitutedParameters = {
            ...substitutedParameters,
            [key]: isDynamicValue(evaluatedValue) ? "" : evaluatedValue,
          };
        }
      });
    }

    // we destructure the values back to the appropriate places.
    if ("parameters" in params) {
      evaluatedParams = {
        ...params,
        parameters: {
          ...params.parameters,
          ...substitutedParameters,
        },
      };
    } else {
      evaluatedParams = {
        ...params,
      };
    }

    // Call the API to fetch the dynamic values
    const response: ApiResponse = yield call(
      PluginsApi.fetchDynamicFormValues,
      url,
      {
        actionId,
        configProperty,
        datasourceId,
        pluginId,
        ...evaluatedParams,
      },
    );
    dynamicFetchedValues.isLoading = false;
    // @ts-expect-error: we don't know what the response will be
    if (response.responseMeta.status === 200 && "trigger" in response.data) {
      // @ts-expect-error: we don't know what the response will be
      dynamicFetchedValues.data = response.data.trigger;
      dynamicFetchedValues.hasFetchFailed = false;
    } else {
      dynamicFetchedValues.hasFetchFailed = true;
      dynamicFetchedValues.data = [];
    }
  } catch (e) {
    log.error(e);
    dynamicFetchedValues.hasFetchFailed = true;
    dynamicFetchedValues.isLoading = false;
    dynamicFetchedValues.data = [];
  }
  return dynamicFetchedValues;
}

function* formEvaluationChangeListenerSaga() {
  while (true) {
    const action: ReduxAction<FormEvalActionPayload> = yield take(
      FORM_EVALUATION_REDUX_ACTIONS,
    );
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
