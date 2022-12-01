import {
  ApplicationPayload,
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { all, put, takeEvery, call, select, take } from "redux-saga/effects";
import TemplatesAPI, {
  ImportTemplateResponse,
  FetchTemplateResponse,
  TemplateFiltersResponse,
} from "api/TemplatesApi";
import history from "utils/history";
import { getDefaultPageId } from "./ApplicationSagas";
import {
  getAllTemplates,
  setTemplateNotificationSeenAction,
  showTemplatesModal,
} from "actions/templateActions";
import {
  getTemplateNotificationSeen,
  setTemplateNotificationSeen,
} from "utils/storage";
import { validateResponse } from "./ErrorSagas";
import { builderURL } from "RouteBuilder";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { fetchApplication } from "actions/applicationActions";
import { APP_MODE } from "entities/App";
import {
  executePageLoadActions,
  fetchActions,
} from "actions/pluginActionActions";
import { fetchJSCollections } from "actions/jsActionActions";
import { failFastApiCalls } from "./InitSagas";
import { Toaster, Variant } from "design-system";
import { fetchDatasources } from "actions/datasourceActions";
import { fetchPluginFormConfigs } from "actions/pluginActions";
import { fetchAllPageEntityCompletion, saveLayout } from "actions/pageActions";
import { showReconnectDatasourceModal } from "actions/applicationActions";
import { getAllPageIds } from "./selectors";

function* getAllTemplatesSaga() {
  try {
    const response: FetchTemplateResponse = yield call(
      TemplatesAPI.getAllTemplates,
    );
    const isValid: boolean = yield validateResponse(response);
    if (isValid) {
      yield put({
        type: ReduxActionTypes.GET_ALL_TEMPLATES_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.GET_ALL_TEMPLATES_ERROR,
      payload: {
        error,
      },
    });
  }
}

function* importTemplateToWorkspaceSaga(
  action: ReduxAction<{ templateId: string; workspaceId: string }>,
) {
  try {
    const response: ImportTemplateResponse = yield call(
      TemplatesAPI.importTemplate,
      action.payload.templateId,
      action.payload.workspaceId,
    );
    const isValid: boolean = yield validateResponse(response);
    if (isValid) {
      const application: ApplicationPayload = {
        ...response.data.application,
        defaultPageId: getDefaultPageId(
          response.data.application.pages,
        ) as string,
      };
      yield put({
        type: ReduxActionTypes.IMPORT_TEMPLATE_TO_WORKSPACE_SUCCESS,
        payload: response.data.application,
      });

      if (response.data.isPartialImport) {
        yield put(
          showReconnectDatasourceModal({
            application: response.data.application,
            unConfiguredDatasourceList:
              response.data.unConfiguredDatasourceList,
            workspaceId: action.payload.workspaceId,
          }),
        );
      } else {
        const pageURL = builderURL({
          pageId: application.defaultPageId,
        });
        history.push(pageURL);
      }
      yield put(getAllTemplates());
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.IMPORT_TEMPLATE_TO_WORKSPACE_ERROR,
      payload: {
        error,
      },
    });
  }
}

function* getSimilarTemplatesSaga(action: ReduxAction<string>) {
  try {
    const response: FetchTemplateResponse = yield call(
      TemplatesAPI.getSimilarTemplates,
      action.payload,
    );
    const isValid: boolean = yield validateResponse(response);
    if (isValid) {
      yield put({
        type: ReduxActionTypes.GET_SIMILAR_TEMPLATES_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.GET_SIMILAR_TEMPLATES_ERROR,
      payload: {
        error,
      },
    });
  }
}

function* setTemplateNotificationSeenSaga(action: ReduxAction<boolean>) {
  yield setTemplateNotificationSeen(action.payload);
}

function* getTemplateNotificationSeenSaga() {
  const showTemplateNotification: unknown = yield getTemplateNotificationSeen();

  if (showTemplateNotification) {
    yield put(setTemplateNotificationSeenAction(true));
  } else {
    yield put(setTemplateNotificationSeenAction(false));
  }
}

function* getTemplateSaga(action: ReduxAction<string>) {
  try {
    const response: FetchTemplateResponse = yield call(
      TemplatesAPI.getTemplateInformation,
      action.payload,
    );
    const isValid: boolean = yield validateResponse(response);
    if (isValid) {
      yield put({
        type: ReduxActionTypes.GET_TEMPLATE_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.GET_TEMPLATE_ERROR,
      payload: {
        error,
      },
    });
  }
}

function* postPageAdditionSaga(applicationId: string) {
  const afterActionsFetch: boolean = yield failFastApiCalls(
    [
      fetchActions({ applicationId }, []),
      fetchJSCollections({ applicationId }),
      fetchDatasources(),
    ],
    [
      ReduxActionTypes.FETCH_ACTIONS_SUCCESS,
      ReduxActionTypes.FETCH_JS_ACTIONS_SUCCESS,
      ReduxActionTypes.FETCH_DATASOURCES_SUCCESS,
    ],
    [
      ReduxActionErrorTypes.FETCH_ACTIONS_ERROR,
      ReduxActionErrorTypes.FETCH_JS_ACTIONS_ERROR,
      ReduxActionErrorTypes.FETCH_DATASOURCES_ERROR,
    ],
  );

  if (!afterActionsFetch) {
    throw new Error("Failed importing template");
  }

  const afterPluginFormsFetch: boolean = yield failFastApiCalls(
    [fetchPluginFormConfigs()],
    [ReduxActionTypes.FETCH_PLUGIN_FORM_CONFIGS_SUCCESS],
    [ReduxActionErrorTypes.FETCH_PLUGIN_FORM_CONFIGS_ERROR],
  );

  if (!afterPluginFormsFetch) {
    throw new Error("Failed importing template");
  }

  yield put(fetchAllPageEntityCompletion([executePageLoadActions()]));
}

function* forkTemplateToApplicationSaga(
  action: ReduxAction<{
    templateId: string;
    templateName: string;
    pageNames?: string[];
  }>,
) {
  try {
    const pagesToImport = action.payload.pageNames
      ? action.payload.pageNames
      : undefined;
    const applicationId: string = yield select(getCurrentApplicationId);
    const workspaceId: string = yield select(getCurrentWorkspaceId);
    const response: ImportTemplateResponse = yield call(
      TemplatesAPI.importTemplateToApplication,
      action.payload.templateId,
      applicationId,
      workspaceId,
      pagesToImport,
    );
    // To fetch the new set of pages after merging the template into the existing application
    yield put(
      fetchApplication({
        mode: APP_MODE.EDIT,
        applicationId,
      }),
    );
    const isValid: boolean = yield validateResponse(response);

    if (isValid) {
      yield call(postPageAdditionSaga, applicationId);
      const pages: string[] = yield select(getAllPageIds);

      if (response.data.isPartialImport) {
        yield put(
          showReconnectDatasourceModal({
            application: response.data.application,
            unConfiguredDatasourceList:
              response.data.unConfiguredDatasourceList,
            workspaceId,
            pageId: pages[0],
          }),
        );
      }
      history.push(
        builderURL({
          pageId: pages[0],
        }),
      );
      yield put(showTemplatesModal(false));

      yield take(ReduxActionTypes.UPDATE_CANVAS_STRUCTURE);
      yield put(saveLayout());
      yield put({
        type: ReduxActionTypes.IMPORT_TEMPLATE_TO_APPLICATION_SUCCESS,
        payload: response.data.application,
      });
      yield put(getAllTemplates());

      Toaster.show({
        text: `Pages from '${action.payload.templateName}' template added successfully`,
        variant: Variant.success,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.IMPORT_TEMPLATE_TO_APPLICATION_ERROR,
      payload: {
        error,
      },
    });
  }
}

function* getTemplateFiltersSaga() {
  try {
    const response: TemplateFiltersResponse = yield call(
      TemplatesAPI.getTemplateFilters,
    );
    const isValid: boolean = yield validateResponse(response);
    if (isValid) {
      yield put({
        type: ReduxActionTypes.GET_TEMPLATE_FILTERS_SUCCESS,
        payload: response.data,
      });
    }
  } catch (e) {
    yield put({
      type: ReduxActionErrorTypes.GET_TEMPLATE_FILTERS_ERROR,
      payload: {
        e,
      },
    });
  }
}

export default function* watchActionSagas() {
  yield all([
    takeEvery(ReduxActionTypes.GET_ALL_TEMPLATES_INIT, getAllTemplatesSaga),
    takeEvery(ReduxActionTypes.GET_TEMPLATE_INIT, getTemplateSaga),
    takeEvery(
      ReduxActionTypes.GET_SIMILAR_TEMPLATES_INIT,
      getSimilarTemplatesSaga,
    ),
    takeEvery(
      ReduxActionTypes.IMPORT_TEMPLATE_TO_WORKSPACE_INIT,
      importTemplateToWorkspaceSaga,
    ),
    takeEvery(
      ReduxActionTypes.GET_TEMPLATE_NOTIFICATION_SEEN,
      getTemplateNotificationSeenSaga,
    ),
    takeEvery(
      ReduxActionTypes.SET_TEMPLATE_NOTIFICATION_SEEN,
      setTemplateNotificationSeenSaga,
    ),
    takeEvery(
      ReduxActionTypes.IMPORT_TEMPLATE_TO_APPLICATION_INIT,
      forkTemplateToApplicationSaga,
    ),
    takeEvery(
      ReduxActionTypes.GET_TEMPLATE_FILTERS_INIT,
      getTemplateFiltersSaga,
    ),
  ]);
}
