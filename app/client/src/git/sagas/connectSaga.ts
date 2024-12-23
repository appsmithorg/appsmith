import { gitArtifactActions } from "../store/gitArtifactSlice";
import connectRequest from "../requests/connectRequest";
import type {
  ConnectRequestParams,
  ConnectResponse,
} from "../requests/connectRequest.types";
import { GitArtifactType, GitErrorCodes } from "../constants/enums";
import type { GitArtifactPayloadAction } from "../store/types";
import type { ConnectInitPayload } from "../store/actions/connectActions";

import { call, put } from "redux-saga/effects";

// Internal dependencies
import { validateResponse } from "sagas/ErrorSagas";
import { fetchPageAction } from "actions/pageActions";
import history from "utils/history";
import { addBranchParam } from "constants/routes";
import log from "loglevel";
import { captureException } from "@sentry/react";

export default function* connectSaga(
  action: GitArtifactPayloadAction<ConnectInitPayload>,
) {
  const { artifactType, baseArtifactId } = action.payload;
  const basePayload = { artifactType, baseArtifactId };

  let response: ConnectResponse | undefined;

  try {
    const params: ConnectRequestParams = {
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
        const newUrl = addBranchParam(branch);

        history.replace(newUrl);
        // ! case for updating lastDeployedAt in application manually?
      }

      yield put(
        gitArtifactActions.initGitForEditor({
          ...basePayload,
          artifact: response.data,
        }),
      );
    }
  } catch (e) {
    if (response && response.responseMeta.error) {
      const { error } = response.responseMeta;

      if (GitErrorCodes.REPO_LIMIT_REACHED === error.code) {
        yield put(
          gitArtifactActions.toggleRepoLimitErrorModal({
            ...basePayload,
            open: true,
          }),
        );
      }

      yield put(gitArtifactActions.connectError({ ...basePayload, error }));
    } else {
      log.error(e);
      captureException(e);
    }
  }
}
