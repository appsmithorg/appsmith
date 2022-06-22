export * from "ce/sagas/SuperUserSagas";
import {
  FetchAdminSettingsSaga,
  FetchAdminSettingsErrorSaga,
  SaveAdminSettingsSaga,
  RestartServerPoll,
  SendTestEmail,
} from "ce/sagas/SuperUserSagas";
import UserApi, { FetchSamlMetadataPayload } from "@appsmith/api/UserApi";
import { Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";
import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { User } from "constants/userConstants";
import { takeLatest, all, call, put } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";
import { ApiResponse } from "api/ApiResponses";

export function* FetchSamlMetadataSaga(
  action: ReduxAction<FetchSamlMetadataPayload>,
) {
  const settings = action.payload;
  try {
    const response: ApiResponse = yield call(
      UserApi.fetchSamlMetadata,
      settings,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      Toaster.show({
        text: "Successfully Saved",
        variant: Variant.success,
      });
      yield put({
        type: ReduxActionTypes.FETCH_SAML_METADATA_SUCCESS,
      });
      yield put({
        type: ReduxActionTypes.FETCH_ADMIN_SETTINGS_SUCCESS,
        payload: {
          APPSMITH_SSO_SAML_ENABLED: action.payload.isEnabled,
        },
      });
      yield put({
        type: ReduxActionTypes.RESTART_SERVER_POLL,
      });
    } else {
      yield put({
        type: ReduxActionTypes.FETCH_SAML_METADATA_ERROR,
      });
    }
  } catch (e) {
    yield put({
      type: ReduxActionTypes.FETCH_SAML_METADATA_ERROR,
    });
  }
}

export function* InitSuperUserSaga(action: ReduxAction<User>) {
  const user = action.payload;
  if (user.isSuperUser) {
    yield all([
      takeLatest(ReduxActionTypes.FETCH_ADMIN_SETTINGS, FetchAdminSettingsSaga),
      takeLatest(
        ReduxActionTypes.FETCH_ADMIN_SETTINGS_ERROR,
        FetchAdminSettingsErrorSaga,
      ),
      takeLatest(ReduxActionTypes.SAVE_ADMIN_SETTINGS, SaveAdminSettingsSaga),
      takeLatest(ReduxActionTypes.FETCH_SAML_METADATA, FetchSamlMetadataSaga),
      takeLatest(ReduxActionTypes.RESTART_SERVER_POLL, RestartServerPoll),
      takeLatest(ReduxActionTypes.SEND_TEST_EMAIL, SendTestEmail),
    ]);
  }
}

export default function* SuperUserSagas() {
  yield takeLatest(
    ReduxActionTypes.FETCH_USER_DETAILS_SUCCESS,
    InitSuperUserSaga,
  );
}
