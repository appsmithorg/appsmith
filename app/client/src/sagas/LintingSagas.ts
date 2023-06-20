import { setLintingErrors } from "actions/lintingActions";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { APP_MODE } from "entities/App";
import { call, put, select, takeEvery } from "redux-saga/effects";
import { getAppMode } from "selectors/entitiesSelector";
import type { TJSLibrary } from "workers/common/JSLibrary";
import { logLatestLintPropertyErrors } from "./PostLintingSagas";
import { getAppsmithConfigs } from "@appsmith/configs";
import type { AppState } from "@appsmith/reducers";
import type { LintError } from "utils/DynamicBindingUtils";
import { get, set, uniq } from "lodash";
import type { LintErrorsStore } from "reducers/lintingReducers/lintErrorsReducers";
import type { TJSPropertiesState } from "workers/Evaluation/JSObject/jsPropertiesState";
import { LintingService } from "Linting/LintingService";
import type {
  LintTreeRequestPayload,
  LintTreeResponse,
  LintTreeSagaRequestData,
} from "Linting/types";
import { getUnevaluatedDataTree } from "selectors/dataTreeSelectors";
import { getEntityNameAndPropertyPath } from "@appsmith/workers/Evaluation/evaluationUtils";
import { shouldLint } from "actions/evaluationActions";

const APPSMITH_CONFIGS = getAppsmithConfigs();

export const lintWorker = new LintingService({ useWorker: true });

function* updateLintGlobals(
  action: ReduxAction<{ add?: boolean; libs: TJSLibrary[] }>,
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
  action: ReduxAction<unknown>,
  forceLinting = false,
) {
  const appMode: ReturnType<typeof getAppMode> = yield select(getAppMode);
  if (appMode !== APP_MODE.EDIT || !shouldLint(action)) return;
  const {
    configTree,
    unEvalTree: unevalTree,
  }: ReturnType<typeof getUnevaluatedDataTree> = yield select(
    getUnevaluatedDataTree,
  );

  yield call(lintTreeSaga, {
    unevalTree,
    configTree,
    forceLinting,
  });
}

export function* handleCustomLibrary(action: ReduxAction<unknown>) {
  yield call(initiateLinting, action, true);
}

export default function* lintTreeSagaWatcher() {
  yield takeEvery(ReduxActionTypes.UPDATE_LINT_GLOBALS, updateLintGlobals);
  yield takeEvery(
    [
      ReduxActionTypes.INSTALL_LIBRARY_SUCCESS,
      ReduxActionTypes.UNINSTALL_LIBRARY_SUCCESS,
    ],
    handleCustomLibrary,
  );

  yield takeEvery(ReduxActionTypes.UPDATE_JS_ACTION_BODY_INIT, initiateLinting);
}
