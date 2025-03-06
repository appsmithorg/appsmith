import type { PayloadAction } from "@reduxjs/toolkit";
import { call, put, select } from "redux-saga/effects";
import type { UpdateGlobalProfileInitPayload } from "../store/actions/updateGlobalProfileActions";
import updateGlobalProfileRequest from "../requests/updateGlobalProfileRequest";
import type {
  UpdateGlobalProfileRequestParams,
  UpdateGlobalProfileResponse,
} from "../requests/updateGlobalProfileRequest.types";
import { validateResponse } from "sagas/ErrorSagas";
import { gitGlobalActions } from "git/store/gitGlobalSlice";
import handleApiErrors from "./helpers/handleApiErrors";
import { selectGitApiContractsEnabled } from "git/store/selectors/gitFeatureFlagSelectors";

export default function* updateGlobalProfileSaga(
  action: PayloadAction<UpdateGlobalProfileInitPayload>,
) {
  let response: UpdateGlobalProfileResponse | undefined;

  try {
    const params: UpdateGlobalProfileRequestParams = {
      authorName: action.payload.authorName,
      authorEmail: action.payload.authorEmail,
    };

    const isGitApiContractsEnabled: boolean = yield select(
      selectGitApiContractsEnabled,
    );

    response = yield call(
      updateGlobalProfileRequest,
      params,
      isGitApiContractsEnabled,
    );

    const isValidResponse: boolean = yield validateResponse(response, true);

    if (response && isValidResponse) {
      yield put(gitGlobalActions.updateGlobalProfileSuccess());
      yield put(gitGlobalActions.fetchGlobalProfileInit());
    }
  } catch (e) {
    const error = handleApiErrors(e as Error, response);

    if (error) {
      yield put(gitGlobalActions.updateGlobalProfileError({ error }));
    }
  }
}
