import {
  importPartialApplicationSuccess,
  initDatasourceConnectionDuringImportRequest,
} from "@appsmith/actions/applicationActions";
import ApplicationApi from "@appsmith/api/ApplicationApi";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionErrorTypes } from "@appsmith/constants/ReduxActionConstants";
import type { AppState } from "@appsmith/reducers";
import { areEnvironmentsFetched } from "@appsmith/selectors/environmentSelectors";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { pasteWidget } from "actions/widgetActions";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import type { ApiResponse } from "api/ApiResponses";
import { toast } from "design-system";
import { call, fork, put, select } from "redux-saga/effects";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { getCopiedWidgets, saveCopiedWidgets } from "utils/storage";
import { validateResponse } from "../ErrorSagas";
import { postPageAdditionSaga } from "../TemplatesSagas";

async function readJSONFile(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);
        resolve(json);
      } catch (e) {
        reject(e);
      }
    };
    reader.readAsText(file);
  });
}

function* partialImportWidgetsSaga(file: File) {
  const existingCopiedWidgets: unknown = yield call(getCopiedWidgets);
  try {
    // assume that action.payload.applicationFile is a JSON file. Parse it and extract widgets property
    const userUploadedJSON: { widgets: string } = yield call(
      readJSONFile,
      file,
    );
    if ("widgets" in userUploadedJSON && userUploadedJSON.widgets.length > 0) {
      yield saveCopiedWidgets(userUploadedJSON.widgets);
      yield put(selectWidgetInitAction(SelectionRequestType.Empty));
      yield put(pasteWidget(false, { x: 0, y: 0 }));
    }
  } finally {
    if (existingCopiedWidgets) {
      yield call(saveCopiedWidgets, JSON.stringify(existingCopiedWidgets));
    }
  }
}

export function* partialImportSaga(
  action: ReduxAction<{ applicationFile: File }>,
) {
  try {
    // Step1: Import widgets from file, in parallel
    yield fork(partialImportWidgetsSaga, action.payload.applicationFile);
    // Step2: Send backend request to import pending items.
    const workspaceId: string = yield select(getCurrentWorkspaceId);
    const pageId: string = yield select(getCurrentPageId);
    const applicationId: string = yield select(getCurrentApplicationId);
    const response: ApiResponse = yield call(
      ApplicationApi.importPartialApplication,
      {
        applicationFile: action.payload.applicationFile,
        workspaceId,
        pageId,
        applicationId,
      },
    );

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield call(postPageAdditionSaga, applicationId);
      toast.show("Partial Application imported successfully", {
        kind: "success",
      });

      const environmentsFetched: boolean = yield select((state: AppState) =>
        areEnvironmentsFetched(state, workspaceId),
      );

      if (workspaceId && environmentsFetched) {
        yield put(
          initDatasourceConnectionDuringImportRequest({
            workspaceId: workspaceId as string,
            isPartialImport: true,
          }),
        );
      }

      yield put(importPartialApplicationSuccess());
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.PARTIAL_IMPORT_ERROR,
      payload: {
        error,
      },
    });
  }
}
