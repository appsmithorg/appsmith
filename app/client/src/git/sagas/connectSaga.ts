import { gitArtifactActions } from "../store/gitArtifactSlice";
import connectRequest from "../requests/connectRequest";
import type { ConnectResponse } from "../requests/connectRequest.types";
import { GitArtifactType, GitErrorCodes } from "../constants/enums";
import { GIT_BRANCH_QUERY_KEY } from "../constants/misc";
import type { GitArtifactPayloadAction } from "../types";
import type { ConnectInitPayload } from "../actions/connectActions";

import { call, put } from "redux-saga/effects";

// Internal dependencies
import { validateResponse } from "sagas/ErrorSagas";
import { fetchPageAction } from "actions/pageActions";
import history from "utils/history";
import { captureException } from "@sentry/react";

export default function* connectSaga(
  action: GitArtifactPayloadAction<ConnectInitPayload>,
) {
  const { artifactType, baseArtifactId } = action.payload;
  const basePayload = { artifactType, baseArtifactId };

  let response: ConnectResponse | undefined;

  try {
    const params = {
      remoteUrl: action.payload.remoteUrl,
      gitProfile: action.payload.gitProfile,
    };

    response = yield call(connectRequest, baseArtifactId, params);

    const isValidResponse: boolean = yield validateResponse(response, false);

    if (response && isValidResponse) {
      yield put(gitArtifactActions.connectSuccess(basePayload));

      // needs to happen only when artifactType is application
      if (artifactType === GitArtifactType.Application) {
        const { branchedPageId } = action.payload;

        if (branchedPageId) {
          yield put(fetchPageAction(branchedPageId));
        }

        const branch = response.data.gitApplicationMetadata.branchName;
        const url = new URL(window.location.href);

        url.searchParams.set(GIT_BRANCH_QUERY_KEY, encodeURIComponent(branch));
        url.toString().slice(url.origin.length);
        history.replace(url);
        // ! case for updating lastDeployedAt in application manually?
      }
    }
  } catch (error) {
    if (
      GitErrorCodes.REPO_LIMIT_REACHED === response?.responseMeta?.error?.code
    ) {
      yield put(
        gitArtifactActions.toggleRepoLimitErrorModal({
          ...basePayload,
          open: true,
        }),
      );
    }

    if (response?.responseMeta?.error?.message) {
      yield put(
        gitArtifactActions.connectError({
          ...basePayload,
          error: response.responseMeta.error.message,
        }),
      );
    } else {
      captureException(error);
    }
  }
}
