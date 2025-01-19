import { toast } from "@appsmith/ads";
import { captureException } from "@sentry/react";
import { builderURL } from "ee/RouteBuilder";
import { createMessage, DISCARD_SUCCESS } from "ee/constants/messages";
import discardRequest from "git/requests/discardRequest";
import type { DiscardResponse } from "git/requests/discardRequest.types";
import type { DiscardInitPayload } from "git/store/actions/discardActions";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import { selectGitApiContractsEnabled } from "git/store/selectors/gitFeatureFlagSelectors";
import type { GitArtifactPayloadAction } from "git/store/types";
import log from "loglevel";
import { call, delay, put, select } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";

export default function* discardSaga(
  action: GitArtifactPayloadAction<DiscardInitPayload>,
) {
  const { artifactDef, artifactId } = action.payload;

  let response: DiscardResponse | undefined;

  try {
    const isGitApiContractsEnabled: boolean = yield select(
      selectGitApiContractsEnabled,
    );

    response = yield call(
      discardRequest,
      artifactDef.artifactType,
      artifactId,
      isGitApiContractsEnabled,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (response && isValidResponse) {
      yield put(gitArtifactActions.discardSuccess({ artifactDef }));
      toast.show(createMessage(DISCARD_SUCCESS), {
        kind: "success",
      });
      // adding delay to show toast animation before reloading
      yield delay(500);
      const basePageId: string =
        response.data?.pages?.find((page) => page.isDefault)?.baseId || "";
      const branch = response.data?.gitApplicationMetadata?.branchName;

      window.open(builderURL({ basePageId, branch }), "_self");
    }
  } catch (e) {
    if (response?.responseMeta?.error) {
      const { error } = response.responseMeta;

      yield put(gitArtifactActions.discardError({ artifactDef, error }));
    } else {
      log.error(e);
      captureException(e);
    }
  }
}
