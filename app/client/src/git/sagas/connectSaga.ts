import { gitArtifactActions } from "../store/gitArtifactSlice";
import connectRequest from "../requests/connectRequest";
import type {
  ConnectRequestParams,
  ConnectResponse,
} from "../requests/connectRequest.types";
import { GitArtifactType, GitErrorCodes } from "../constants/enums";
import type { GitArtifactPayloadAction } from "../store/types";
import type { ConnectInitPayload } from "../store/actions/connectActions";

import { call, put, select } from "redux-saga/effects";

// Internal dependencies
import { validateResponse } from "sagas/ErrorSagas";
import { fetchPageAction } from "actions/pageActions";
import history from "utils/history";
import { addBranchParam } from "constants/routes";
import log from "loglevel";
import { captureException } from "@sentry/react";
import { getCurrentPageId } from "selectors/editorSelectors";
import { gitGlobalActions } from "git/store/gitGlobalSlice";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import type { ApplicationPayload } from "entities/Application";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { selectGitApiContractsEnabled } from "git/store/selectors/gitFeatureFlagSelectors";

export default function* connectSaga(
  action: GitArtifactPayloadAction<ConnectInitPayload>,
) {
  const { artifactDef } = action.payload;

  let response: ConnectResponse | undefined;

  try {
    const params: ConnectRequestParams = {
      remoteUrl: action.payload.remoteUrl,
      gitProfile: action.payload.gitProfile,
    };

    const isGitApiContractsEnabled: boolean = yield select(
      selectGitApiContractsEnabled,
    );

    response = yield call(
      connectRequest,
      artifactDef.artifactType,
      artifactDef.baseArtifactId,
      params,
      isGitApiContractsEnabled,
    );

    const isValidResponse: boolean = yield validateResponse(response, false);

    if (response && isValidResponse) {
      yield put(
        gitArtifactActions.connectSuccess({
          artifactDef,
          responseData: response.data,
        }),
      );

      // needs to happen only when artifactType is application
      if (artifactDef.artifactType === GitArtifactType.Application) {
        const pageId: string = yield select(getCurrentPageId);

        yield put(fetchPageAction(pageId));

        const branch = response.data?.gitApplicationMetadata?.branchName;

        if (branch) {
          const newUrl = addBranchParam(branch);

          history.replace(newUrl);
        }

        const currentApplication: ApplicationPayload = yield select(
          getCurrentApplication,
        );

        if (currentApplication) {
          currentApplication.lastDeployedAt = new Date().toISOString();
          yield put({
            type: ReduxActionTypes.FETCH_APPLICATION_SUCCESS,
            payload: currentApplication,
          });
        }
      }

      yield put(
        gitArtifactActions.initGitForEditor({
          artifactDef,
          artifact: response.data,
        }),
      );
      yield put(
        gitArtifactActions.toggleConnectModal({ artifactDef, open: false }),
      );
      yield put(
        gitArtifactActions.toggleConnectSuccessModal({
          artifactDef,
          open: true,
        }),
      );
    }
  } catch (e) {
    if (response && response.responseMeta.error) {
      const { error } = response.responseMeta;

      if (GitErrorCodes.REPO_LIMIT_REACHED === error.code) {
        yield put(
          gitArtifactActions.toggleConnectModal({
            artifactDef,
            open: false,
          }),
        );
        yield put(
          gitGlobalActions.toggleRepoLimitErrorModal({
            open: true,
          }),
        );
      }

      yield put(gitArtifactActions.connectError({ artifactDef, error }));
    } else {
      log.error(e);
      captureException(e);
    }
  }
}
