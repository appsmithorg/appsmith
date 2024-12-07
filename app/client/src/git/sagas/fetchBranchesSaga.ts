import type { FetchBranchesInitPayload } from "git/actions/fetchBranchesActions";
import fetchBranchesRequest from "git/requests/fetchBranchesRequest";
import type { FetchBranchesResponse } from "git/requests/fetchBranchesRequest.types";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import type { GitArtifactPayloadAction } from "git/types";
import { call, put } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";

export default function* fetchBranchesSaga(
  action: GitArtifactPayloadAction<FetchBranchesInitPayload>,
) {
  const { artifactType, baseArtifactId } = action.payload;
  const basePayload = { artifactType, baseArtifactId };
  let response: FetchBranchesResponse | undefined;

  try {
    const params = {
      pruneBranches: action.payload.pruneBranches,
    };

    response = yield call(fetchBranchesRequest, baseArtifactId, params);
    const isValidResponse: boolean = yield validateResponse(response, false);

    if (response && isValidResponse) {
      yield put(
        gitArtifactActions.fetchBranchesSuccess({
          ...basePayload,
          responseData: response.data,
        }),
      );
    }
  } catch (error) {
    yield put(
      gitArtifactActions.fetchBranchesError({
        ...basePayload,
        error: error as string,
      }),
    );
  }
}
