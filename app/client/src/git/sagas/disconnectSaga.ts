import { captureException } from "@sentry/react";
import { fetchAllApplicationsOfWorkspace } from "ee/actions/applicationActions";
import { GitOpsTab } from "git/constants/enums";
import { GIT_BRANCH_QUERY_KEY } from "git/constants/misc";
import disconnectRequest from "git/requests/disconnectRequest";
import type { DisconnectResponse } from "git/requests/disconnectRequest.types";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import { selectDisconnectArtifactDef } from "git/store/selectors/gitArtifactSelectors";
import type { GitArtifactDef, GitArtifactPayloadAction } from "git/store/types";
import log from "loglevel";
import { call, put, select } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";
import history from "utils/history";

export default function* disconnectSaga(action: GitArtifactPayloadAction) {
  const { artifactDef } = action.payload;
  const disconnectArtifactDef: GitArtifactDef = yield select(
    selectDisconnectArtifactDef,
    artifactDef,
  );
  let response: DisconnectResponse | undefined;

  try {
    response = yield call(
      disconnectRequest,
      disconnectArtifactDef.baseArtifactId,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (response && isValidResponse) {
      yield put(gitArtifactActions.disconnectSuccess({ artifactDef }));

      if (artifactDef.baseArtifactId === disconnectArtifactDef.baseArtifactId) {
        const url = new URL(window.location.href);

        url.searchParams.delete(GIT_BRANCH_QUERY_KEY);
        history.replace(url.toString().slice(url.origin.length));
        yield put(gitArtifactActions.unmount({ artifactDef }));
        yield put(
          gitArtifactActions.initGitForEditor({
            artifactDef,
            artifact: response.data,
          }),
        );
        yield put(gitArtifactActions.closeDisconnectModal({ artifactDef }));
        yield put(
          gitArtifactActions.toggleOpsModal({
            artifactDef,
            open: false,
            tab: GitOpsTab.Deploy,
          }),
        );
        yield put(fetchAllApplicationsOfWorkspace());
      } else {
        yield put(
          gitArtifactActions.toggleConnectModal({ artifactDef, open: true }),
        );
      }
    }
  } catch (e) {
    if (response && response.responseMeta.error) {
      const { error } = response.responseMeta;

      yield put(gitArtifactActions.disconnectError({ artifactDef, error }));
    } else {
      log.error(e);
      captureException(e);
    }
  }
}
