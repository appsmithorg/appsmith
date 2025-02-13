import { toast } from "@appsmith/ads";
import discardRequest from "git/requests/discardRequest";
import type { DiscardResponse } from "git/requests/discardRequest.types";
import type { DiscardInitPayload } from "git/store/actions/discardActions";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import { selectGitApiContractsEnabled } from "git/store/selectors/gitFeatureFlagSelectors";
import type { GitArtifactPayloadAction } from "git/store/types";
import { call, put, select } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";
import handleApiErrors from "./helpers/handleApiErrors";
import applicationRedirectToClosestEntitySaga from "git/artifact-helpers/application/applicationRedirectToClosestEntitySaga";
import packageRedirectToClosestEntitySaga from "git/artifact-helpers/package/packageRedirectToClosestEntitySaga";
import { GitArtifactType, GitOpsTab } from "git/constants/enums";

export default function* discardSaga(
  action: GitArtifactPayloadAction<DiscardInitPayload>,
) {
  const { artifactDef, artifactId, successMessage } = action.payload;

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
      if (artifactDef.artifactType === GitArtifactType.Application) {
        yield applicationRedirectToClosestEntitySaga(window.location.href);
      } else if (artifactDef.artifactType === GitArtifactType.Package) {
        yield packageRedirectToClosestEntitySaga(window.location.href);
      }

      yield put(gitArtifactActions.discardSuccess({ artifactDef }));

      if (successMessage) {
        toast.show(successMessage, { kind: "success" });
      }

      yield put(
        gitArtifactActions.toggleOpsModal({
          artifactDef,
          open: false,
          tab: GitOpsTab.Deploy,
        }),
      );
    }
  } catch (e) {
    const error = handleApiErrors(e as Error, response);

    if (error) {
      yield put(gitArtifactActions.discardError({ artifactDef, error }));
    }
  }
}
