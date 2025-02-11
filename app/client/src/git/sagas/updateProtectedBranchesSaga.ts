import { toast } from "@appsmith/ads";
import { captureException } from "@sentry/react";
import { createMessage, PROTECT_BRANCH_SUCCESS } from "ee/constants/messages";
import updateProtectedBranchesRequest from "git/requests/updateProtectedBranchesRequest";
import type {
  UpdateProtectedBranchesRequestParams,
  UpdateProtectedBranchesResponse,
} from "git/requests/updateProtectedBranchesRequest.types";
import type { UpdateProtectedBranchesInitPayload } from "git/store/actions/updateProtectedBranchesActions";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import { selectGitApiContractsEnabled } from "git/store/selectors/gitFeatureFlagSelectors";
import type { GitArtifactPayloadAction } from "git/store/types";
import log from "loglevel";
import { call, put, select } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";

export default function* updateProtectedBranchesSaga(
  action: GitArtifactPayloadAction<UpdateProtectedBranchesInitPayload>,
) {
  const { artifactDef } = action.payload;
  let response: UpdateProtectedBranchesResponse | undefined;

  try {
    const params: UpdateProtectedBranchesRequestParams = {
      branchNames: action.payload.branchNames,
    };

    const isGitApiContractsEnabled: boolean = yield select(
      selectGitApiContractsEnabled,
    );

    response = yield call(
      updateProtectedBranchesRequest,
      artifactDef.artifactType,
      artifactDef.baseArtifactId,
      params,
      isGitApiContractsEnabled,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (response && isValidResponse) {
      yield put(
        gitArtifactActions.updateProtectedBranchesSuccess({ artifactDef }),
      );
      yield put(gitArtifactActions.fetchProtectedBranchesInit({ artifactDef }));

      toast.show(createMessage(PROTECT_BRANCH_SUCCESS), {
        kind: "success",
      });
    }
  } catch (e) {
    if (response && response.responseMeta.error) {
      const { error } = response.responseMeta;

      yield put(
        gitArtifactActions.updateProtectedBranchesError({
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
