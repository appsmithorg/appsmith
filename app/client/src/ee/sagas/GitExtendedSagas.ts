export * from "ce/sagas/GitExtendedSagas";
import GitExtendedApi from "@appsmith/api/GitExtendedApi";
import type { ApiResponse } from "api/ApiResponses";
import {
  ReduxActionTypes,
  type ReduxAction,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  GIT_CD_DISABLED_TOAST,
  GIT_CD_ENABLED_TOAST,
  UPDATE_DEFAULT_BRANCH_SUCCESS,
  createMessage,
} from "@appsmith/constants/messages";
import { toast } from "design-system";
import { call, delay, put, select } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { getLogToSentryFromResponse } from "utils/helpers";

export function* updateGitDefaultBranchSaga({
  payload,
}: ReduxAction<{ branchName: string }>) {
  const { branchName } = payload;
  const applicationId: string = yield select(getCurrentApplicationId);
  let response: ApiResponse<string> | undefined;
  try {
    response = yield call(
      GitExtendedApi.updateDefaultBranch,
      applicationId,
      branchName,
    );
    const isValidResponse: boolean = yield validateResponse(
      response,
      false,
      getLogToSentryFromResponse(response),
    );
    if (isValidResponse) {
      yield put({ type: ReduxActionTypes.GIT_UPDATE_DEFAULT_BRANCH_SUCCESS });
      toast.show(createMessage(UPDATE_DEFAULT_BRANCH_SUCCESS, branchName), {
        kind: "success",
      });
      // adding this for toast animation
      yield delay(500);
      location.reload();
    } else {
      yield put({
        type: ReduxActionTypes.GIT_UPDATE_DEFAULT_BRANCH_ERROR,
        payload: { error: response?.responseMeta?.error?.message, show: true },
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionTypes.GIT_UPDATE_DEFAULT_BRANCH_ERROR,
      payload: { error, show: true },
    });
  }
}

export function* generateCdApiKeySaga() {
  const applicationId: string = yield select(getCurrentApplicationId);
  let response: ApiResponse<string> | undefined;
  try {
    response = yield call(GitExtendedApi.generateCDApiKey, applicationId);
    const isValidResponse: boolean = yield validateResponse(
      response,
      false,
      getLogToSentryFromResponse(response),
    );
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.GIT_EX_GENERATE_CD_API_KEY_SUCCESS,
        payload: { cdApiKey: response?.data },
      });
    } else {
      yield put({
        type: ReduxActionErrorTypes.GIT_EX_GENERATE_CD_API_KEY_ERROR,
        payload: { error: response?.responseMeta?.error?.message, show: true },
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.GIT_EX_GENERATE_CD_API_KEY_ERROR,
      payload: { error, show: true },
    });
  }
}

export function* updateCdConfigSaga({
  payload,
}: ReduxAction<{ enabled: boolean; branchName?: string }>) {
  const applicationId: string = yield select(getCurrentApplicationId);
  let response: ApiResponse<string> | undefined;
  try {
    response = yield call(
      GitExtendedApi.updateCDconfiguration,
      applicationId,
      payload.enabled,
      payload.branchName,
    );
    const isValidResponse: boolean = yield validateResponse(
      response,
      false,
      getLogToSentryFromResponse(response),
    );
    if (isValidResponse) {
      yield put({ type: ReduxActionTypes.GIT_EX_UPDATE_CD_CONFIG_SUCCESS });
      yield put({ type: ReduxActionTypes.GIT_GET_METADATA_INIT });
      toast.show(
        createMessage(
          payload.enabled ? GIT_CD_ENABLED_TOAST : GIT_CD_DISABLED_TOAST,
        ),
        {
          kind: "success",
        },
      );
    } else {
      yield put({
        type: ReduxActionErrorTypes.GIT_EX_UPDATE_CD_CONFIG_ERROR,
        payload: { error: response?.responseMeta?.error?.message, show: true },
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.GIT_EX_UPDATE_CD_CONFIG_ERROR,
      payload: { error, show: true },
    });
  }
}

export const gitExtendedSagas = {
  [ReduxActionTypes.GIT_UPDATE_DEFAULT_BRANCH_INIT]: updateGitDefaultBranchSaga,
  [ReduxActionTypes.GIT_EX_GENERATE_CD_API_KEY_INIT]: generateCdApiKeySaga,
  [ReduxActionTypes.GIT_EX_UPDATE_CD_CONFIG_INIT]: updateCdConfigSaga,
};
