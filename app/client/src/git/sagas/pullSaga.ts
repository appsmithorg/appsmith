import { call, put, select } from "redux-saga/effects";
import pullRequest from "git/requests/pullRequest";
import type { PullResponse } from "git/requests/pullRequest.types";
import type { PullInitPayload } from "git/store/actions/pullActions";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import type { GitArtifactPayloadAction } from "git/store/types";
import { validateResponse } from "sagas/ErrorSagas";
import { selectGitApiContractsEnabled } from "git/store/selectors/gitFeatureFlagSelectors";
import handleApiErrors from "./helpers/handleApiErrors";
import { toast } from "@appsmith/ads";
import { createMessage, DISCARD_AND_PULL_SUCCESS } from "ee/constants/messages";

export default function* pullSaga(
  action: GitArtifactPayloadAction<PullInitPayload>,
) {
  const { artifactDef, artifactId } = action.payload;
  let response: PullResponse | undefined;

  try {
    const isGitApiContractsEnabled: boolean = yield select(
      selectGitApiContractsEnabled,
    );

    response = yield call(
      pullRequest,
      artifactDef.artifactType,
      artifactId,
      isGitApiContractsEnabled,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (response && isValidResponse) {
      yield put(
        gitArtifactActions.pullSuccess({
          artifactDef,
          responseData: response.data.artifact,
        }),
      );
    }
  } catch (e) {
    const error = handleApiErrors(e as Error, response);

    if (error) {
      yield put(gitArtifactActions.pullError({ artifactDef, error }));
    }

    if (action.payload.showErrorInPopup) {
      yield put(
        gitArtifactActions.toggleConflictErrorModal({
          artifactDef,
          open: true,
        }),
      );

      toast.show(createMessage(DISCARD_AND_PULL_SUCCESS), {
        kind: "success",
      });
    }
  }
}
