import { builderURL } from "ee/RouteBuilder";
import {
  fetchApplication,
  showReconnectDatasourceModal,
} from "ee/actions/applicationActions";
import type { ApplicationPayload } from "entities/Application";
import type { ReduxAction } from "actions/ReduxActionTypes";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import urlBuilder from "ee/entities/URLRedirect/URLAssembly";
import { findDefaultPage } from "pages/utils";
import { fetchPageDSLSaga } from "ee/sagas/PageSagas";
import { getCurrentWorkspaceId } from "ee/selectors/selectedWorkspaceSelectors";
import { isAirgapped } from "ee/utils/airgapHelpers";
import { fetchJSLibraries } from "actions/JSLibraryActions";
import { fetchDatasources } from "actions/datasourceActions";
import { fetchJSCollections } from "actions/jsActionActions";
import { fetchAllPageEntityCompletion, saveLayout } from "actions/pageActions";
import {
  executePageLoadActions,
  fetchActions,
} from "actions/pluginActionActions";
import { fetchPluginFormConfigs } from "actions/pluginActions";
import {
  getAllTemplates,
  hideTemplatesModal,
  setTemplateNotificationSeenAction,
} from "actions/templateActions";
import type {
  FetchTemplateResponse,
  ImportTemplateResponse,
  TemplateFiltersResponse,
} from "api/TemplatesApi";
import TemplatesAPI from "api/TemplatesApi";
import { toast } from "@appsmith/ads";
import { APP_MODE } from "entities/App";
import { all, call, put, select, take, takeEvery } from "redux-saga/effects";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import history from "utils/history";
import {
  getTemplateNotificationSeen,
  setTemplateNotificationSeen,
} from "utils/storage";
import { validateResponse } from "./ErrorSagas";
import { failFastApiCalls } from "./InitSagas";
import { getAllPageIdentities } from "./selectors";

const isAirgappedInstance = isAirgapped();
const AI_DATASOURCE_NAME = "AI Datasource";

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
      const defaultPage = findDefaultPage(response.data.application.pages);
      const application: ApplicationPayload = {
        ...response.data.application,
        defaultPageId: defaultPage?.id,
        defaultBasePageId: defaultPage?.baseId,
      };

      yield put({
        type: ReduxActionTypes.IMPORT_TEMPLATE_TO_WORKSPACE_SUCCESS,
        payload: response.data.application,
      });

      // Temporary fix to remove AI Datasource from the unConfiguredDatasourceList
      // so we can avoid showing the AI Datasource in reconnect datasource modal
      const filteredUnConfiguredDatasourceList = (
        response.data.unConfiguredDatasourceList || []
      ).filter((datasource) => datasource.name !== AI_DATASOURCE_NAME);

      if (
        response.data.isPartialImport &&
        filteredUnConfiguredDatasourceList.length > 0
      ) {
        yield put(
          showReconnectDatasourceModal({
            application: response.data.application,
            unConfiguredDatasourceList: filteredUnConfiguredDatasourceList,
            workspaceId: action.payload.workspaceId,
          }),
        );
      } else {
        const pageURL = builderURL({
          basePageId: application.defaultBasePageId,
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

export function* postPageAdditionSaga(applicationId: string) {
  const afterActionsFetch: boolean = yield failFastApiCalls(
    [
      fetchActions({ applicationId }, []),
      fetchJSCollections({ applicationId }),
      fetchDatasources(),
      fetchJSLibraries(applicationId),
    ],
    [
      ReduxActionTypes.FETCH_ACTIONS_SUCCESS,
      ReduxActionTypes.FETCH_JS_ACTIONS_SUCCESS,
      ReduxActionTypes.FETCH_DATASOURCES_SUCCESS,
      ReduxActionTypes.FETCH_JS_LIBRARIES_SUCCESS,
    ],
    [
      ReduxActionErrorTypes.FETCH_ACTIONS_ERROR,
      ReduxActionErrorTypes.FETCH_JS_ACTIONS_ERROR,
      ReduxActionErrorTypes.FETCH_DATASOURCES_ERROR,
      ReduxActionErrorTypes.FETCH_JS_LIBRARIES_FAILED,
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
    pageNames?: string[];
    templateId: string;
    templateName: string;
  }>,
) {
  try {
    const {
      isValid,
    }: {
      isValid: boolean;
    } = yield call(apiCallForForkTemplateToApplicaion, action);

    if (isValid) {
      yield put(hideTemplatesModal());
      yield put(getAllTemplates());

      toast.show(
        `Pages from '${action.payload.templateName}' template added successfully`,
        {
          kind: "success",
        },
      );
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

function* apiCallForForkTemplateToApplicaion(
  action: ReduxAction<{
    templateId: string;
    templateName: string;
    pageNames?: string[] | undefined;
  }>,
) {
  const pagesToImport = action.payload.pageNames
    ? action.payload.pageNames
    : undefined;
  const applicationId: string = yield select(getCurrentApplicationId);
  const workspaceId: string = yield select(getCurrentWorkspaceId);
  const prevPages: { pageId: string; basePageId: string }[] =
    yield select(getAllPageIdentities);
  const prevPageIds = prevPages.map((page) => page.pageId);
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
    const pages: { pageId: string; basePageId: string }[] =
      yield select(getAllPageIdentities);
    const templatePageIds: string[] = pages
      .filter((page) => !prevPageIds.includes(page.pageId))
      .map((page) => page.pageId);

    const pageDSLs: unknown = yield all(
      templatePageIds.map((pageId: string) => {
        return call(fetchPageDSLSaga, pageId);
      }),
    );

    yield put({
      type: ReduxActionTypes.FETCH_PAGE_DSLS_SUCCESS,
      payload: pageDSLs,
    });

    yield put({
      type: ReduxActionTypes.UPDATE_PAGE_LIST,
      payload: pageDSLs,
    });

    if (response.data.isPartialImport) {
      yield put(
        showReconnectDatasourceModal({
          application: response.data.application,
          unConfiguredDatasourceList: response.data.unConfiguredDatasourceList,
          workspaceId,
          pageId: pages[0].pageId,
        }),
      );
    }

    history.push(
      builderURL({
        basePageId: pages[0].basePageId,
      }),
    );
    yield take(ReduxActionTypes.UPDATE_CANVAS_STRUCTURE);
    yield put(saveLayout());
    yield put({
      type: ReduxActionTypes.IMPORT_TEMPLATE_TO_APPLICATION_SUCCESS,
      payload: response.data.application,
    });

    return { isValid, applicationId, templatePageIds, prevPageIds };
  }

  return { isValid };
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

function* forkTemplateToApplicationViaOnboardingFlowSaga(
  action: ReduxAction<{
    pageNames?: string[];
    templateId: string;
    templateName: string;
    applicationId: string;
    workspaceId: string;
  }>,
) {
  try {
    const response: ImportTemplateResponse = yield call(
      TemplatesAPI.importTemplateToApplication,
      action.payload.templateId,
      action.payload.applicationId,
      action.payload.workspaceId,
      action.payload.pageNames,
    );

    const isValid: boolean = yield validateResponse(response);

    if (isValid) {
      const application = response.data.application;

      urlBuilder.updateURLParams(
        {
          applicationSlug: application.slug,
          applicationVersion: application.applicationVersion,
          baseApplicationId: application.baseId,
        },
        application.pages.map((page) => ({
          pageSlug: page.slug,
          customSlug: page.customSlug,
          basePageId: page.baseId,
        })),
      );
      history.push(
        builderURL({
          basePageId: application.pages[0].id,
        }),
      );

      // This is to remove the existing default Page 1 in the new application after template has been imported.
      // 1. Set new page as default
      const importedTemplatePages = application.pages.filter(
        (page) => !page.isDefault,
      );

      yield put({
        type: ReduxActionTypes.SET_DEFAULT_APPLICATION_PAGE_INIT,
        payload: {
          id: importedTemplatePages[0].id,
          applicationId: application.id,
        },
      });

      yield take(ReduxActionTypes.SET_DEFAULT_APPLICATION_PAGE_SUCCESS);

      const defaultPageId = application.pages.filter(
        (page) => page.isDefault,
      )[0].id;

      //2. Delete old default page (Page 1)
      yield put({
        type: ReduxActionTypes.DELETE_PAGE_INIT,
        payload: {
          id: defaultPageId,
        },
      });

      yield put({
        type: ReduxActionTypes.IMPORT_TEMPLATE_TO_APPLICATION_ONBOARDING_FLOW_SUCCESS,
        payload: response.data.application,
      });
      toast.show(
        `Pages from '${action.payload.templateName}' template added successfully`,
        {
          kind: "success",
        },
      );
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.IMPORT_TEMPLATE_TO_APPLICATION_ONBOARDING_FLOW_ERROR,
      payload: {
        error,
      },
    });
  }
}

// TODO: Refactor and handle this airgap check in a better way - posssibly in root sagas (sangeeth)
export default function* watchActionSagas() {
  if (!isAirgappedInstance)
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
      takeEvery(
        ReduxActionTypes.IMPORT_TEMPLATE_TO_APPLICATION_ONBOARDING_FLOW,
        forkTemplateToApplicationViaOnboardingFlowSaga,
      ),
    ]);
}
