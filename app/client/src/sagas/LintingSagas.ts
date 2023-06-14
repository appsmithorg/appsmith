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
    const jsObjectProperties = Object.keys(jsObjectState);

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

export function* lintTreeSaga(action: ReduxAction<LintTreeSagaRequestData>) {
  const { configTree, unevalTree } = action.payload;
  // only perform lint operations in edit mode
  const appMode: APP_MODE = yield select(getAppMode);
  if (appMode !== APP_MODE.EDIT) return;

  const lintTreeRequestData: LintTreeRequestPayload = {
    unevalTree,
    configTree,
    cloudHosting: !!APPSMITH_CONFIGS.cloudHosting,
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

export function* initiateLinting(requiresLinting: boolean) {
  const appMode: ReturnType<typeof getAppMode> = yield select(getAppMode);
  if (!requiresLinting || appMode !== APP_MODE.EDIT) return;

  const {
    configTree,
    unEvalTree: unevalTree,
  }: ReturnType<typeof getUnevaluatedDataTree> = yield select(
    getUnevaluatedDataTree,
  );

  yield put({
    type: ReduxActionTypes.LINT_TREE,
    payload: {
      unevalTree,
      configTree,
    },
  });
}

export default function* lintTreeSagaWatcher() {
  yield takeEvery(ReduxActionTypes.UPDATE_LINT_GLOBALS, updateLintGlobals);
  yield takeEvery(ReduxActionTypes.LINT_TREE, lintTreeSaga);
}
