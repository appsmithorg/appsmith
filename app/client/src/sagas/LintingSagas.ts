import { setLintingErrors } from "actions/lintingActions";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { APP_MODE } from "entities/App";
import { call, put, select, takeEvery } from "redux-saga/effects";
import { getAppMode } from "@appsmith/selectors/entitiesSelector";
import type { JSLibrary } from "workers/common/JSLibrary";
import { logLatestLintPropertyErrors } from "./PostLintingSagas";
import { getAppsmithConfigs } from "@appsmith/configs";
import type { AppState } from "@appsmith/reducers";
import type { LintError } from "utils/DynamicBindingUtils";
import { get, set, uniq } from "lodash";
import type { LintErrorsStore } from "reducers/lintingReducers/lintErrorsReducers";
import type { TJSPropertiesState } from "workers/Evaluation/JSObject/jsPropertiesState";
import type {
  LintTreeRequestPayload,
  LintTreeResponse,
  LintTreeSagaRequestData,
} from "plugins/Linting/types";
import type { getUnevaluatedDataTree } from "selectors/dataTreeSelectors";
import { getEntityNameAndPropertyPath } from "@appsmith/workers/Evaluation/evaluationUtils";
import { Linter } from "plugins/Linting/Linter";
import log from "loglevel";
import { getFixedTimeDifference } from "workers/common/DataTreeEvaluator/utils";
import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";

const APPSMITH_CONFIGS = getAppsmithConfigs();

export const lintWorker = new Linter();

function* updateLintGlobals(
  action: ReduxAction<{ add?: boolean; libs: JSLibrary[] }>,
) {
  const appMode: APP_MODE = yield select(getAppMode);
  const isEditorMode = appMode === APP_MODE.EDIT;
  if (!isEditorMode) return;
  yield call(lintWorker.updateJSLibraryGlobals, action.payload);
}

function* updateOldJSCollectionLintErrors(
  lintedJSPaths: string[],
  errors: LintErrorsStore,
  jsObjectsState: TJSPropertiesState,
) {
  const jsEntities = uniq(
    lintedJSPaths.map((path) => getEntityNameAndPropertyPath(path).entityName),
  );
  const updatedJSCollectionLintErrors: LintErrorsStore = {};
  for (const jsObjectName of jsEntities) {
    const jsObjectBodyPath = `["${jsObjectName}.body"]`;
    const oldJsBodyLintErrors: LintError[] = yield select((state: AppState) =>
      get(state.linting.errors, jsObjectBodyPath, []),
    );
    const newJSBodyLintErrors = get(
      errors,
      jsObjectBodyPath,
      [] as LintError[],
    );

    const jsObjectState = get(jsObjectsState, jsObjectName, {});
    const jsObjectProperties = Object.keys(jsObjectState).map(
      (propertyName) => `${jsObjectName}.${propertyName}`,
    );

    const filteredOldJsObjectBodyLintErrors = oldJsBodyLintErrors.filter(
      (lintError) =>
        lintError.originalPath &&
        jsObjectProperties.includes(lintError.originalPath) &&
        !lintedJSPaths.includes(lintError.originalPath),
    );
    const updatedLintErrors = [
      ...filteredOldJsObjectBodyLintErrors,
      ...newJSBodyLintErrors,
    ];
    set(updatedJSCollectionLintErrors, jsObjectBodyPath, updatedLintErrors);
  }
  return updatedJSCollectionLintErrors;
}

export function* lintTreeSaga(payload: LintTreeSagaRequestData) {
  const { configTree, forceLinting, unevalTree } = payload;

  const lintTreeRequestData: LintTreeRequestPayload = {
    unevalTree,
    configTree,
    cloudHosting: !!APPSMITH_CONFIGS.cloudHosting,
    forceLinting,
  };

  const { errors, jsPropertiesState, lintedJSPaths }: LintTreeResponse =
    yield call(lintWorker.lintTree, lintTreeRequestData);

  const updatedOldJSCollectionLintErrors: LintErrorsStore =
    yield updateOldJSCollectionLintErrors(
      lintedJSPaths,
      errors,
      jsPropertiesState,
    );

  const updatedErrors = { ...errors, ...updatedOldJSCollectionLintErrors };

  yield put(setLintingErrors(updatedErrors));
  yield call(logLatestLintPropertyErrors, {
    errors,
    dataTree: unevalTree,
  });
}

export function* initiateLinting(
  unEvalAndConfigTree: ReturnType<typeof getUnevaluatedDataTree>,
  forceLinting: boolean,
) {
  const lintingStartTime = performance.now();
  const { configTree, unEvalTree: unevalTree } = unEvalAndConfigTree;

  yield call(lintTreeSaga, {
    unevalTree,
    configTree,
    forceLinting,
  });
  log.debug({
    lintTime: getFixedTimeDifference(performance.now(), lintingStartTime),
  });
}

export default function* lintTreeSagaWatcher() {
  yield takeEvery(ReduxActionTypes.UPDATE_LINT_GLOBALS, updateLintGlobals);
  yield takeEvery(ReduxActionTypes.START_EVALUATION, setupSaga);
}

export function* setupSaga(): any {
  const featureFlags = yield select(selectFeatureFlags);
  yield call(lintWorker.setup, featureFlags);
}
