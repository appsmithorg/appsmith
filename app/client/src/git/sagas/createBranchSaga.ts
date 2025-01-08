import { call, put } from "redux-saga/effects";
import type { CreateBranchInitPayload } from "../store/actions/createBranchActions";
import createBranchRequest from "../requests/createBranchRequest";
import type {
  CreateBranchRequestParams,
  CreateBranchResponse,
} from "../requests/createBranchRequest.types";
import { gitArtifactActions } from "../store/gitArtifactSlice";
import type { GitArtifactPayloadAction } from "../store/types";

// internal dependencies
import { validateResponse } from "sagas/ErrorSagas";
import { captureException } from "@sentry/react";
import log from "loglevel";

export default function* createBranchSaga(
  action: GitArtifactPayloadAction<CreateBranchInitPayload>,
) {
  const { artifactDef, artifactId } = action.payload;
  let response: CreateBranchResponse | undefined;

  try {
    const params: CreateBranchRequestParams = {
      branchName: action.payload.branchName,
    };

    response = yield call(createBranchRequest, artifactId, params);
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      // yield put(
      //   gitArtifactActions.fetchBranchesInit({
      //     artifactDef,
      //     artifactId,
      //     pruneBranches: true,
      //   }),
      // );
      yield put(
        gitArtifactActions.checkoutBranchInit({
          artifactDef,
          artifactId,
          branchName: action.payload.branchName,
        }),
      );
      yield put(gitArtifactActions.createBranchSuccess({ artifactDef }));
      yield put(
        gitArtifactActions.toggleBranchPopup({
          artifactDef,
          open: false,
        }),
      );
    }
  } catch (e) {
    if (response && response.responseMeta.error) {
      const { error } = response.responseMeta;

      yield put(
        gitArtifactActions.createBranchError({
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
