import { toast } from "@appsmith/ads";
import { createMessage, IMPORT_APP_SUCCESSFUL } from "ee/constants/messages";
import { builderURL } from "ee/RouteBuilder";
import { showReconnectDatasourceModal } from "ee/actions/applicationActions";
import type { ApplicationResponsePayload } from "ee/api/ApplicationApi";
import type { GitImportSuccessPayload } from "git/store/actions/gitImportActions";
import type { GitArtifactPayloadAction } from "git/store/types";
import { put } from "redux-saga/effects";
import history from "utils/history";

export default function* applicationImportFromGitSaga(
  action: GitArtifactPayloadAction<GitImportSuccessPayload>,
) {
  const { responseData } = action.payload;
  const { isPartialImport, unConfiguredDatasourceList } = responseData;

  const application =
    (responseData.application as ApplicationResponsePayload) ?? null;

  if (!application) return;

  // there is configuration-missing datasources
  if (isPartialImport) {
    yield put(
      showReconnectDatasourceModal({
        application: application as ApplicationResponsePayload,
        unConfiguredDatasourceList: unConfiguredDatasourceList ?? [],
        workspaceId: application?.workspaceId ?? "",
      }),
    );
  } else {
    let basePageId = "";

    if (application.pages && application.pages.length > 0) {
      const defaultPage = application.pages.find(
        (eachPage) => !!eachPage.isDefault,
      );

      basePageId = defaultPage ? defaultPage.baseId : "";
    }

    const branch = application?.gitApplicationMetadata?.branchName;

    const pageURL = builderURL({
      basePageId,
      branch,
    });

    history.push(pageURL);
    toast.show(createMessage(IMPORT_APP_SUCCESSFUL), {
      kind: "success",
    });
  }
}
