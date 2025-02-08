import type { PayloadAction } from "@reduxjs/toolkit";
import { call, put } from "redux-saga/effects";
import type { UpdateGlobalProfileInitPayload } from "../store/actions/updateGlobalProfileActions";
import updateGlobalProfileRequest from "../requests/updateGlobalProfileRequest";
import type {
  UpdateGlobalProfileRequestParams,
  UpdateGlobalProfileResponse,
} from "../requests/updateGlobalProfileRequest.types";

// internal dependencies
import { validateResponse } from "sagas/ErrorSagas";
import log from "loglevel";
import { captureException } from "@sentry/react";
import { gitGlobalActions } from "git/store/gitGlobalSlice";

export default function* updateGlobalProfileSaga(
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
      yield put(gitGlobalActions.updateGlobalProfileSuccess());
      yield put(gitGlobalActions.fetchGlobalProfileInit());
    }
  } catch (e) {
    if (response && response.responseMeta.error) {
      const { error } = response.responseMeta;

      yield put(gitGlobalActions.updateGlobalProfileError({ error }));
    } else {
      log.error(e);
      captureException(e);
    }
  }
}
