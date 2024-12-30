import log from "loglevel";
import { call, put, select } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";
import history from "utils/history";
import { toast } from "@appsmith/ads";
import type { PayloadAction } from "@reduxjs/toolkit";
import { captureException } from "@sentry/react";
import gitImportRequest from "git/requests/gitImportRequest";
import type { GitImportResponse } from "git/requests/gitImportRequest.types";
import type { GitImportInitPayload } from "git/store/actions/gitImportActions";
import { gitGlobalActions } from "git/store/gitGlobalSlice";
import { createMessage, IMPORT_APP_SUCCESSFUL } from "ee/constants/messages";
import { builderURL } from "ee/RouteBuilder";
import { getWorkspaceIdForImport } from "ee/selectors/applicationSelectors";
import { showReconnectDatasourceModal } from "ee/actions/applicationActions";
import type { Workspace } from "ee/constants/workspaceConstants";
import { getFetchedWorkspaces } from "ee/selectors/workspaceSelectors";

export default function* gitImportSaga(
  action: PayloadAction<GitImportInitPayload>,
) {
  const { ...params } = action.payload;
  const workspaceId: string = yield select(getWorkspaceIdForImport);

  let response: GitImportResponse | undefined;

  try {
    response = yield call(gitImportRequest, workspaceId, params);
    const isValidResponse: boolean = yield validateResponse(response);

    if (response && isValidResponse) {
      const allWorkspaces: Workspace[] = yield select(getFetchedWorkspaces);
      const currentWorkspace = allWorkspaces.filter(
        (el: Workspace) => el.id === workspaceId,
      );

      if (currentWorkspace.length > 0) {
        const { application, isPartialImport, unconfiguredDatasourceList } =
          response.data;

        yield put(gitGlobalActions.gitImportSuccess());
        yield put(gitGlobalActions.toggleImportModal({ open: false }));

        // there is configuration-missing datasources
        if (isPartialImport) {
          yield put(
            showReconnectDatasourceModal({
              application: application,
              unConfiguredDatasourceList: unconfiguredDatasourceList ?? [],
              workspaceId,
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

          const pageURL = builderURL({
            basePageId,
          });

          history.push(pageURL);
          toast.show(createMessage(IMPORT_APP_SUCCESSFUL), {
            kind: "success",
          });
        }
      }
    }
  } catch (e) {
    // const isRepoLimitReachedError: boolean = yield call(
    //   handleRepoLimitReachedError,
    //   response,
    // );

    // if (isRepoLimitReachedError) return;

    if (response?.responseMeta?.error) {
      yield put(
        gitGlobalActions.gitImportError({ error: response.responseMeta.error }),
      );
    } else {
      log.error(e);
      captureException(e);
    }
  }
}
