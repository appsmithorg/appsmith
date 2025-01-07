import type { FetchBranchesInitPayload } from "../store/actions/fetchBranchesActions";
import fetchBranchesRequest from "git/requests/fetchBranchesRequest";
import type {
  FetchBranchesRequestParams,
  FetchBranchesResponse,
} from "git/requests/fetchBranchesRequest.types";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import type { GitArtifactPayloadAction } from "../store/types";
import { call, put } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";
import log from "loglevel";
import { captureException } from "@sentry/react";

export default function* fetchBranchesSaga(
  action: GitArtifactPayloadAction<FetchBranchesInitPayload>,
) {
  const { artifactDef, artifactId } = action.payload;
  let response: FetchBranchesResponse | undefined;

  try {
    const params: FetchBranchesRequestParams = {
      pruneBranches: action.payload.pruneBranches,
    };

    response = yield call(fetchBranchesRequest, artifactId, params);
    const isValidResponse: boolean = yield validateResponse(response, false);

    if (response && isValidResponse) {
      yield put(
        gitArtifactActions.fetchBranchesSuccess({
          artifactDef,
          responseData: response.data,
        }),
      );
    }
  } catch (e) {
    if (response && response.responseMeta.error) {
      const { error } = response.responseMeta;

      yield put(
        gitArtifactActions.fetchBranchesError({
          artifactDef,
          error,
        }),
      );
    } else {
      log.error(e);
      captureException(e);
    }
  }
}
