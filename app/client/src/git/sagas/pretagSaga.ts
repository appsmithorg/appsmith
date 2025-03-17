import pretagRequest from "git/requests/pretagRequest";
import type { PretagResponse } from "git/requests/pretagRequest.types";
import type { PretagInitPayload } from "git/store/actions/pretagActions";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import type { GitArtifactPayloadAction } from "git/store/types";
import { call, put } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";
import handleApiErrors from "./helpers/handleApiErrors";

export default function* pretagSaga(
  action: GitArtifactPayloadAction<PretagInitPayload>,
) {
  const { artifactDef, artifactId } = action.payload;
  let response: PretagResponse | undefined;

  try {
    response = yield call(pretagRequest, artifactDef.artifactType, artifactId);

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse && response?.data) {
      yield put(
        gitArtifactActions.pretagSuccess({
          artifactDef,
          responseData: response.data,
        }),
      );
    }
  } catch (e) {
    const error = handleApiErrors(e as Error, response);

    if (error) {
      yield put(gitArtifactActions.pretagError({ artifactDef, error }));
    }
  }
}
