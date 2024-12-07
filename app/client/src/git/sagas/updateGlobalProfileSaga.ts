import type { PayloadAction } from "@reduxjs/toolkit";
import { call, put } from "redux-saga/effects";
import type { UpdateGlobalProfileInitPayload } from "../actions/updateGlobalProfileActions";
import updateGlobalProfileRequest from "../requests/updateGlobalProfileRequest";
import type {
  UpdateGlobalProfileRequestParams,
  UpdateGlobalProfileResponse,
} from "../requests/updateGlobalProfileRequest.types";
import { gitConfigActions } from "../store/gitConfigSlice";

// internal dependencies
import { validateResponse } from "sagas/ErrorSagas";

export default function* updateGlobalGitConfig(
  action: PayloadAction<UpdateGlobalProfileInitPayload>,
) {
  let response: UpdateGlobalProfileResponse | undefined;

  try {
    const params: UpdateGlobalProfileRequestParams = {
      authorName: action.payload.authorName,
      authorEmail: action.payload.authorEmail,
    };

    response = yield call(updateGlobalProfileRequest, params);

    const isValidResponse: boolean = yield validateResponse(response, true);

    if (response && isValidResponse) {
      yield put(gitConfigActions.updateGlobalProfileSuccess());
      yield put(gitConfigActions.fetchGlobalProfileInit());
    }
  } catch (error) {
    yield put(
      gitConfigActions.updateGlobalProfileError({ error: error as string }),
    );
  }
}
