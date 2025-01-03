import { call, put, select } from "redux-saga/effects";
import pullRequest from "git/requests/pullRequest";
import type { PullResponse } from "git/requests/pullRequest.types";
import type { PullInitPayload } from "git/store/actions/pullActions";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import type { GitArtifactPayloadAction } from "git/store/types";
import { selectCurrentBranch } from "git/store/selectors/gitArtifactSelectors";

// internal dependencies
import { validateResponse } from "sagas/ErrorSagas";
import { getCurrentBasePageId } from "selectors/editorSelectors";
import { initEditorAction } from "actions/initActions";
import { APP_MODE } from "entities/App";
import log from "loglevel";
import { captureException } from "@sentry/react";

export default function* pullSaga(
  action: GitArtifactPayloadAction<PullInitPayload>,
) {
  const { artifactDef, artifactId } = action.payload;
  let response: PullResponse | undefined;

  try {
    response = yield call(pullRequest, artifactId);
    const isValidResponse: boolean = yield validateResponse(response);

    if (response && isValidResponse) {
      yield put(gitArtifactActions.pullSuccess({ artifactDef }));

      const currentBasePageId: string = yield select(getCurrentBasePageId);
      const currentBranch: string = yield select(
        selectCurrentBranch,
        artifactDef,
      );

      yield put(
        initEditorAction({
          basePageId: currentBasePageId,
          branch: currentBranch,
          mode: APP_MODE.EDIT,
        }),
      );
    }
  } catch (e) {
    if (response && response.responseMeta.error) {
      const { error } = response.responseMeta;

      // !case: handle this with error
      // if (triggeredFromBottomBar) {
      //   yield put(setIsGitErrorPopupVisible({ isVisible: true }));
      // }

      yield put(gitArtifactActions.pullError({ artifactDef, error }));
    } else {
      log.error(e);
      captureException(e);
    }
  }
}
