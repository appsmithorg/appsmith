import {
  all,
  call,
  put,
  select,
  take,
  takeEvery,
  takeLatest,
} from "redux-saga/effects";
import { change, getFormValues, initialize } from "redux-form";
import _, { merge, isEmpty } from "lodash";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
  ReduxActionWithCallbacks,
  ReduxActionWithMeta,
  ReduxFormActionTypes,
} from "constants/ReduxActionConstants";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import {
  getDatasource,
  getDatasourceDraft,
  getPluginForm,
  getGenerateCRUDEnabledPluginMap,
  getPluginPackageFromDatasourceId,
} from "selectors/entitiesSelector";
import {
  changeDatasource,
  createDatasourceFromForm,
  fetchDatasourceStructure,
  setDatsourceEditorMode,
  updateDatasourceSuccess,
  UpdateDatasourceSuccessAction,
  executeDatasourceQueryReduxAction,
} from "actions/datasourceActions";
import { ApiResponse, GenericApiResponse } from "api/ApiResponses";
import DatasourcesApi, { CreateDatasourceConfig } from "api/DatasourcesApi";
import { Datasource } from "entities/Datasource";

import {
  API_EDITOR_ID_URL,
  DATA_SOURCES_EDITOR_ID_URL,
  INTEGRATION_EDITOR_MODES,
  INTEGRATION_EDITOR_URL,
  INTEGRATION_TABS,
} from "constants/routes";
import history from "utils/history";
import {
  API_EDITOR_FORM_NAME,
  DATASOURCE_DB_FORM,
  DATASOURCE_REST_API_FORM,
} from "constants/forms";
import { validateResponse } from "./ErrorSagas";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getFormData } from "selectors/formSelectors";
import { getCurrentOrgId } from "selectors/organizationSelectors";
import { Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";
import { getConfigInitialValues } from "components/formControls/utils";
import { setActionProperty } from "actions/pluginActionActions";
import { authorizeDatasourceWithAppsmithToken } from "api/CloudServicesApi";
import {
  createMessage,
  DATASOURCE_CREATE,
  DATASOURCE_DELETE,
  DATASOURCE_UPDATE,
  DATASOURCE_VALID,
  OAUTH_APPSMITH_TOKEN_NOT_FOUND,
  OAUTH_AUTHORIZATION_APPSMITH_ERROR,
  OAUTH_AUTHORIZATION_FAILED,
  OAUTH_AUTHORIZATION_SUCCESSFUL,
} from "@appsmith/constants/messages";
import AppsmithConsole from "utils/AppsmithConsole";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import localStorage from "utils/localStorage";
import log from "loglevel";
import {
  APPSMITH_TOKEN_STORAGE_KEY,
  SAAS_EDITOR_DATASOURCE_ID_URL,
} from "pages/Editor/SaaSEditor/constants";
import { checkAndGetPluginFormConfigsSaga } from "sagas/PluginSagas";
import { PluginType } from "entities/Action";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import { getQueryParams } from "../utils/AppsmithUtils";
import { getGenerateTemplateFormURL } from "../constants/routes";
import { GenerateCRUDEnabledPluginMap } from "../api/PluginApi";
import { getIsGeneratePageInitiator } from "../utils/GenerateCrudUtil";
import { trimQueryString } from "utils/helpers";
import { inGuidedTour } from "selectors/onboardingSelectors";
import { updateReplayEntity } from "actions/pageActions";
import OAuthApi from "api/OAuthApi";
import { AppState } from "reducers";
import { requestModalConfirmationSaga } from "sagas/UtilSagas";

function* fetchDatasourcesSaga() {
  try {
    const orgId = yield select(getCurrentOrgId);
    const response: GenericApiResponse<Datasource[]> = yield DatasourcesApi.fetchDatasources(
      orgId,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_DATASOURCES_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_DATASOURCES_ERROR,
      payload: { error },
    });
  }
}

function* fetchMockDatasourcesSaga() {
  try {
    const response: GenericApiResponse<any> = yield DatasourcesApi.fetchMockDatasources();
    // not validating the api call here. If the call is unsuccessful it'll be unblocking. And we'll hide the mock DB section.
    yield put({
      type: ReduxActionTypes.FETCH_MOCK_DATASOURCES_SUCCESS,
      payload: !!response && !!response.data ? response.data : [],
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_MOCK_DATASOURCES_ERROR,
      payload: { error },
    });
  }
}

interface addMockDb
  extends ReduxActionWithCallbacks<
    {
      name: string;
      organizationId: string;
      pluginId: string;
      packageName: string;
    },
    unknown,
    unknown
  > {
  extraParams?: any;
}

export function* addMockDbToDatasources(actionPayload: addMockDb) {
  try {
    const {
      name,
      organizationId,
      packageName,
      pluginId,
    } = actionPayload.payload;
    const { isGeneratePageMode } = actionPayload.extraParams;
    const response: GenericApiResponse<any> = yield DatasourcesApi.addMockDbToDatasources(
      name,
      organizationId,
      pluginId,
      packageName,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.ADD_MOCK_DATASOURCES_SUCCESS,
        payload: response.data,
      });
      yield put({
        type: ReduxActionTypes.FETCH_DATASOURCES_INIT,
      });
      yield put({
        type: ReduxActionTypes.FETCH_PLUGINS_REQUEST,
      });
      yield call(checkAndGetPluginFormConfigsSaga, response.data.pluginId);
      const applicationId: string = yield select(getCurrentApplicationId);
      const pageId: string = yield select(getCurrentPageId);
      const isGeneratePageInitiator = getIsGeneratePageInitiator(
        isGeneratePageMode,
      );
      const isInGuidedTour = yield select(inGuidedTour);
      if (isGeneratePageInitiator) {
        history.push(
          getGenerateTemplateFormURL(applicationId, pageId, {
            datasourceId: response.data.id,
          }),
        );
      } else {
        if (isInGuidedTour) return;
        history.push(
          INTEGRATION_EDITOR_URL(
            applicationId,
            pageId,
            INTEGRATION_TABS.ACTIVE,
            "",
            getQueryParams(),
          ),
        );
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.ADD_MOCK_DATASOURCES_ERROR,
      payload: { error },
    });
  }
}

export function* deleteDatasourceSaga(
  actionPayload: ReduxActionWithCallbacks<{ id: string }, unknown, unknown>,
) {
  try {
    // request confirmation from user before deleting datasource.
    const confirmed = yield call(requestModalConfirmationSaga);

    if (!confirmed) {
      return yield put({
        type: ReduxActionTypes.DELETE_DATASOURCE_CANCELLED,
      });
    }

    const id = actionPayload.payload.id;
    const response: GenericApiResponse<Datasource> = yield DatasourcesApi.deleteDatasource(
      id,
    );

    const isValidResponse = yield validateResponse(response);
    const applicationId = yield select(getCurrentApplicationId);

    if (isValidResponse) {
      const pageId = yield select(getCurrentPageId);
      const pluginPackageName = yield select((state: AppState) =>
        getPluginPackageFromDatasourceId(state, id),
      );
      const datasourcePathWithoutQuery = trimQueryString(
        DATA_SOURCES_EDITOR_ID_URL(applicationId, pageId, id),
      );

      const saasPathWithoutQuery = trimQueryString(
        SAAS_EDITOR_DATASOURCE_ID_URL(
          applicationId,
          pageId,
          pluginPackageName,
          id,
        ),
      );

      if (
        window.location.pathname === datasourcePathWithoutQuery ||
        window.location.pathname === saasPathWithoutQuery
      ) {
        history.push(
          INTEGRATION_EDITOR_URL(
            applicationId,
            pageId,
            INTEGRATION_TABS.NEW,
            INTEGRATION_EDITOR_MODES.AUTO,
            getQueryParams(),
          ),
        );
      }

      Toaster.show({
        text: createMessage(DATASOURCE_DELETE, response.data.name),
        variant: Variant.success,
      });

      yield put({
        type: ReduxActionTypes.DELETE_DATASOURCE_SUCCESS,
        payload: response.data,
      });
      yield put({
        type: ReduxActionTypes.DELETE_DATASOURCE_DRAFT,
        payload: {
          id: response.data.id,
        },
      });
      AppsmithConsole.info({
        logType: LOG_TYPE.ENTITY_DELETED,
        text: "Datasource deleted",
        source: {
          id: response.data.id,
          name: response.data.name,
          type: ENTITY_TYPE.DATASOURCE,
        },
      });
      if (actionPayload.onSuccess) {
        yield put(actionPayload.onSuccess);
      }
    }
  } catch (error) {
    const datasource = yield select(getDatasource, actionPayload.payload.id);
    Toaster.show({
      text: error.message,
      variant: Variant.danger,
    });
    yield put({
      type: ReduxActionErrorTypes.DELETE_DATASOURCE_ERROR,
      payload: { error, id: actionPayload.payload.id, show: false },
    });
    AppsmithConsole.error({
      text: error.message,
      source: {
        id: actionPayload.payload.id,
        name: datasource?.name ?? "Datasource name is not set",
        type: ENTITY_TYPE.DATASOURCE,
      },
    });
    if (actionPayload.onError) {
      yield put(actionPayload.onError);
    }
  }
}

function* updateDatasourceSaga(
  actionPayload: ReduxActionWithCallbacks<Datasource, unknown, unknown>,
) {
  try {
    const queryParams = getQueryParams();
    const datasourcePayload = _.omit(actionPayload.payload, "name");
    const response: GenericApiResponse<Datasource> = yield DatasourcesApi.updateDatasource(
      datasourcePayload,
      datasourcePayload.id,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      AnalyticsUtil.logEvent("SAVE_DATA_SOURCE", {
        datasourceName: response.data.name,
      });
      Toaster.show({
        text: createMessage(DATASOURCE_UPDATE, response.data.name),
        variant: Variant.success,
      });

      const state = yield select();
      const expandDatasourceId = state.ui.datasourcePane.expandDatasourceId;
      const datasourceStructure =
        state.entities.datasources.structure[response.data.id];

      // Dont redirect if action payload has an onSuccess
      yield put(
        updateDatasourceSuccess(
          response.data,
          !actionPayload.onSuccess,
          queryParams,
        ),
      );
      yield put(
        setDatsourceEditorMode({ id: datasourcePayload.id, viewMode: true }),
      );
      yield put({
        type: ReduxActionTypes.DELETE_DATASOURCE_DRAFT,
        payload: {
          id: response.data.id,
        },
      });
      if (actionPayload.onSuccess) {
        yield put(actionPayload.onSuccess);
      }
      if (expandDatasourceId === response.data.id && !datasourceStructure) {
        yield put(fetchDatasourceStructure(response.data.id));
      }

      AppsmithConsole.info({
        text: "Datasource configuration saved",
        source: {
          id: response.data.id,
          name: response.data.name,
          type: ENTITY_TYPE.DATASOURCE,
        },
        state: {
          datasourceConfiguration: response.data.datasourceConfiguration,
        },
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_DATASOURCE_ERROR,
      payload: { error },
    });
    if (actionPayload.onError) {
      yield put(actionPayload.onError);
    }
  }
}

function* redirectAuthorizationCodeSaga(
  actionPayload: ReduxAction<{
    datasourceId: string;
    pageId: string;
    pluginType: PluginType;
  }>,
) {
  const { datasourceId, pageId, pluginType } = actionPayload.payload;

  if (pluginType === PluginType.API) {
    window.location.href = `/api/v1/datasources/${datasourceId}/pages/${pageId}/code`;
  } else {
    try {
      // Get an "appsmith token" from the server
      const response: ApiResponse = yield OAuthApi.getAppsmithToken(
        datasourceId,
        pageId,
      );

      if (validateResponse(response)) {
        const appsmithToken = response.data;
        // Save the token for later use once we come back from the auth flow
        localStorage.setItem(APPSMITH_TOKEN_STORAGE_KEY, appsmithToken);
        // Redirect to the cloud services to authorise
        window.location.assign(
          authorizeDatasourceWithAppsmithToken(appsmithToken),
        );
      }
    } catch (e) {
      Toaster.show({
        text: OAUTH_AUTHORIZATION_FAILED,
        variant: Variant.danger,
      });
      log.error(e);
    }
  }
}

function* getOAuthAccessTokenSaga(
  actionPayload: ReduxAction<{ datasourceId: string }>,
) {
  const { datasourceId } = actionPayload.payload;
  // get the saved appsmith token that started the auth request
  const appsmithToken = localStorage.getItem(APPSMITH_TOKEN_STORAGE_KEY);
  if (!appsmithToken) {
    // Error out because auth token should been here
    log.error(OAUTH_APPSMITH_TOKEN_NOT_FOUND);
    Toaster.show({
      text: OAUTH_AUTHORIZATION_APPSMITH_ERROR,
      variant: Variant.danger,
    });
    return;
  }
  try {
    // Get access token for datasource
    const response = yield OAuthApi.getAccessToken(datasourceId, appsmithToken);
    if (validateResponse(response)) {
      // Update the datasource object
      yield put({
        type: ReduxActionTypes.UPDATE_DATASOURCE_SUCCESS,
        payload: response.data,
      });
      Toaster.show({
        text: OAUTH_AUTHORIZATION_SUCCESSFUL,
        variant: Variant.success,
      });
      // Remove the token because it is supposed to be short lived
      localStorage.removeItem(APPSMITH_TOKEN_STORAGE_KEY);
    }
  } catch (e) {
    Toaster.show({
      text: OAUTH_AUTHORIZATION_FAILED,
      variant: Variant.danger,
    });
    log.error(e);
  }
}

function* saveDatasourceNameSaga(
  actionPayload: ReduxAction<{ id: string; name: string }>,
) {
  try {
    const response: GenericApiResponse<Datasource> = yield DatasourcesApi.updateDatasource(
      {
        name: actionPayload.payload.name,
      },
      actionPayload.payload.id,
    );

    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.SAVE_DATASOURCE_NAME_SUCCESS,
        payload: { ...response.data },
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.SAVE_DATASOURCE_NAME_ERROR,
      payload: { id: actionPayload.payload.id },
    });
  }
}

function* handleDatasourceNameChangeFailureSaga(
  action: ReduxAction<{ oldName: string }>,
) {
  yield put(change(DATASOURCE_DB_FORM, "name", action.payload.oldName));
}

function* testDatasourceSaga(actionPayload: ReduxAction<Datasource>) {
  const organizationId = yield select(getCurrentOrgId);
  const { initialValues, values } = yield select(
    getFormData,
    DATASOURCE_DB_FORM,
  );
  const datasource = yield select(getDatasource, actionPayload.payload.id);
  const payload = {
    ...actionPayload.payload,
    name: datasource.name,
    id: actionPayload.payload.id as any,
  };

  if (!_.isEqual(initialValues, values)) {
    delete payload.id;
  }

  try {
    const response: GenericApiResponse<Datasource> = yield DatasourcesApi.testDatasource(
      {
        ...payload,
        organizationId,
      },
    );
    const isValidResponse = yield validateResponse(response);
    let messages: Array<string> = [];
    if (isValidResponse) {
      const responseData = response.data;
      if (
        (responseData.invalids && responseData.invalids.length) ||
        (responseData.messages && responseData.messages.length)
      ) {
        if (responseData.invalids && responseData.invalids.length) {
          Toaster.show({
            text: responseData.invalids[0],
            variant: Variant.danger,
          });
        }
        if (responseData.messages && responseData.messages.length) {
          messages = responseData.messages;
          if (responseData.success) {
            Toaster.show({
              text: createMessage(DATASOURCE_VALID, payload.name),
              variant: Variant.success,
            });
          }
        }
        yield put({
          type: ReduxActionErrorTypes.TEST_DATASOURCE_ERROR,
          payload: { show: false, id: datasource.id, messages: messages },
        });
        AppsmithConsole.error({
          text: "Test Connection failed",
          source: {
            id: actionPayload.payload.id,
            name: datasource.name,
            type: ENTITY_TYPE.DATASOURCE,
          },
          state: {
            message:
              responseData.invalids && responseData.invalids.length
                ? responseData.invalids[0]
                : "",
          },
        });
      } else {
        AnalyticsUtil.logEvent("TEST_DATA_SOURCE_SUCCESS", {
          datasource: payload.name,
        });
        Toaster.show({
          text: createMessage(DATASOURCE_VALID, payload.name),
          variant: Variant.success,
        });
        yield put({
          type: ReduxActionTypes.TEST_DATASOURCE_SUCCESS,
          payload: { show: false, id: datasource.id, messages: [] },
        });
        AppsmithConsole.info({
          text: "Test Connection successful",
          source: {
            id: actionPayload.payload.id,
            name: datasource.name,
            type: ENTITY_TYPE.DATASOURCE,
          },
        });
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.TEST_DATASOURCE_ERROR,
      payload: { error, show: false },
    });
    AppsmithConsole.error({
      text: "Test Connection failed",
      source: {
        id: actionPayload.payload.id,
        name: datasource.name,
        type: ENTITY_TYPE.DATASOURCE,
      },
      state: {
        message: error,
      },
    });
  }
}

function* createDatasourceFromFormSaga(
  actionPayload: ReduxAction<CreateDatasourceConfig>,
) {
  try {
    const organizationId = yield select(getCurrentOrgId);
    yield call(
      checkAndGetPluginFormConfigsSaga,
      actionPayload.payload.pluginId,
    );
    const formConfig = yield select(
      getPluginForm,
      actionPayload.payload.pluginId,
    );

    const initialValues = yield call(getConfigInitialValues, formConfig);

    const payload = merge(initialValues, actionPayload.payload);

    const response: GenericApiResponse<Datasource> = yield DatasourcesApi.createDatasource(
      {
        ...payload,
        organizationId,
      },
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.UPDATE_DATASOURCE_REFS,
        payload: response.data,
      });
      yield put({
        type: ReduxActionTypes.CREATE_DATASOURCE_SUCCESS,
        payload: response.data,
      });
      // Todo: Refactor later.
      // If we move this `put` over to QueryPaneSaga->handleDatasourceCreatedSaga, onboarding tests start failing.
      yield put(
        setDatsourceEditorMode({
          id: response.data.id,
          viewMode: false,
        }),
      );
      Toaster.show({
        text: createMessage(DATASOURCE_CREATE, response.data.name),
        variant: Variant.success,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_DATASOURCE_ERROR,
      payload: { error },
    });
  }
}

function* updateDraftsSaga() {
  const values = yield select(getFormValues(DATASOURCE_DB_FORM));

  if (!values.id) return;
  const datasource = yield select(getDatasource, values.id);

  if (_.isEqual(values, datasource)) {
    yield put({
      type: ReduxActionTypes.DELETE_DATASOURCE_DRAFT,
      payload: { id: values.id },
    });
  } else {
    yield put({
      type: ReduxActionTypes.UPDATE_DATASOURCE_DRAFT,
      payload: { id: values.id, draft: values },
    });
    yield put(updateReplayEntity(values.id, values, ENTITY_TYPE.DATASOURCE));
  }
}

function* changeDatasourceSaga(
  actionPayload: ReduxAction<{ datasource: Datasource }>,
) {
  const { datasource } = actionPayload.payload;
  const { id } = datasource;
  const draft = yield select(getDatasourceDraft, id);
  const applicationId: string = yield select(getCurrentApplicationId);
  const pageId: string = yield select(getCurrentPageId);
  let data;

  if (_.isEmpty(draft)) {
    data = datasource;
  } else {
    data = draft;
  }

  yield put(initialize(DATASOURCE_DB_FORM, _.omit(data, ["name"])));
  // this redirects to the same route, so checking first.
  const datasourcePath = trimQueryString(
    DATA_SOURCES_EDITOR_ID_URL(applicationId, pageId, datasource.id),
  );

  if (history.location.pathname !== datasourcePath)
    history.push(
      DATA_SOURCES_EDITOR_ID_URL(
        applicationId,
        pageId,
        datasource.id,
        getQueryParams(),
      ),
    );
  yield put(
    updateReplayEntity(data.id, _.omit(data, ["name"]), ENTITY_TYPE.DATASOURCE),
  );
}

function* switchDatasourceSaga(action: ReduxAction<{ datasourceId: string }>) {
  const { datasourceId } = action.payload;
  const datasource: Datasource = yield select(getDatasource, datasourceId);
  if (datasource) {
    yield put(changeDatasource({ datasource }));
  }
}

function* formValueChangeSaga(
  actionPayload: ReduxActionWithMeta<string, { field: string; form: string }>,
) {
  const { field, form } = actionPayload.meta;
  if (form === DATASOURCE_REST_API_FORM) {
    const { values } = yield select(getFormData, DATASOURCE_REST_API_FORM);
    if (values && values.datasourceId) {
      yield put(
        updateReplayEntity(values.datasourceId, values, ENTITY_TYPE.DATASOURCE),
      );
    }
  }
  if (form !== DATASOURCE_DB_FORM) return;
  if (field === "name") return;
  yield all([call(updateDraftsSaga)]);
}

function* storeAsDatasourceSaga() {
  const { values } = yield select(getFormData, API_EDITOR_FORM_NAME);
  const applicationId = yield select(getCurrentApplicationId);
  const pageId = yield select(getCurrentPageId);
  let datasource = _.get(values, "datasource");
  datasource = _.omit(datasource, ["name"]);
  const originalHeaders = _.get(values, "actionConfiguration.headers", []);
  const [datasourceHeaders, actionHeaders] = _.partition(
    originalHeaders,
    ({ key, value }: { key: string; value: string }) => {
      return !(isDynamicValue(key) || isDynamicValue(value));
    },
  );
  yield put(
    setActionProperty({
      actionId: values.id,
      propertyName: "actionConfiguration.headers",
      value: actionHeaders,
    }),
  );
  _.set(datasource, "datasourceConfiguration.headers", datasourceHeaders);

  yield put(createDatasourceFromForm(datasource));
  const createDatasourceSuccessAction = yield take(
    ReduxActionTypes.CREATE_DATASOURCE_SUCCESS,
  );
  const createdDatasource = createDatasourceSuccessAction.payload;

  // Update action to have this datasource
  yield put(
    setActionProperty({
      actionId: values.id,
      propertyName: "datasource",
      value: createdDatasource,
    }),
  );

  // Set datasource page to edit mode
  yield put(
    setDatsourceEditorMode({ id: createdDatasource.id, viewMode: false }),
  );

  yield put({
    type: ReduxActionTypes.STORE_AS_DATASOURCE_UPDATE,
    payload: {
      pageId,
      applicationId,
      apiId: values.id,
      datasourceId: createdDatasource.id,
    },
  });

  yield put(changeDatasource({ datasource: createdDatasource }));
}

function* updateDatasourceSuccessSaga(action: UpdateDatasourceSuccessAction) {
  const state = yield select();
  const actionRouteInfo = _.get(state, "ui.datasourcePane.actionRouteInfo");
  const applicationId: string = yield select(getCurrentApplicationId);
  const pageId: string = yield select(getCurrentPageId);
  const generateCRUDSupportedPlugin: GenerateCRUDEnabledPluginMap = yield select(
    getGenerateCRUDEnabledPluginMap,
  );
  const updatedDatasource = action.payload;

  const { queryParams = {} } = action;

  const isGeneratePageInitiator = getIsGeneratePageInitiator(
    queryParams.isGeneratePageMode,
  );

  if (
    isGeneratePageInitiator &&
    updatedDatasource.pluginId &&
    generateCRUDSupportedPlugin[updatedDatasource.pluginId]
  ) {
    history.push(
      getGenerateTemplateFormURL(applicationId, pageId, {
        datasourceId: updatedDatasource.id,
      }),
    );
  } else if (
    actionRouteInfo &&
    updatedDatasource.id === actionRouteInfo.datasourceId &&
    action.redirect
  ) {
    history.push(
      API_EDITOR_ID_URL(
        applicationId,
        actionRouteInfo.pageId,
        actionRouteInfo.apiId,
      ),
    );
  }

  yield put({
    type: ReduxActionTypes.STORE_AS_DATASOURCE_COMPLETE,
  });
}

function* fetchDatasourceStructureSaga(
  action: ReduxAction<{ id: string; ignoreCache: boolean }>,
) {
  const datasource = yield select(getDatasource, action.payload.id);
  try {
    const response: GenericApiResponse<any> = yield DatasourcesApi.fetchDatasourceStructure(
      action.payload.id,
      action.payload.ignoreCache,
    );
    const isValidResponse = yield validateResponse(response, false);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_DATASOURCE_STRUCTURE_SUCCESS,
        payload: {
          data: response.data,
          datasourceId: action.payload.id,
        },
      });

      if (isEmpty(response.data)) {
        AppsmithConsole.warning({
          text: "Datasource structure could not be retrieved",
          source: {
            id: action.payload.id,
            name: datasource.name,
            type: ENTITY_TYPE.DATASOURCE,
          },
        });
      } else {
        AppsmithConsole.info({
          text: "Datasource structure retrieved",
          source: {
            id: action.payload.id,
            name: datasource.name,
            type: ENTITY_TYPE.DATASOURCE,
          },
        });
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_DATASOURCE_STRUCTURE_ERROR,
      payload: {
        error,
        show: false,
      },
    });
    AppsmithConsole.error({
      text: "Datasource structure could not be retrieved",
      source: {
        id: action.payload.id,
        name: datasource.name,
        type: ENTITY_TYPE.DATASOURCE,
      },
    });
  }
}

function* refreshDatasourceStructure(action: ReduxAction<{ id: string }>) {
  const datasource = yield select(getDatasource, action.payload.id);
  try {
    const response: GenericApiResponse<any> = yield DatasourcesApi.fetchDatasourceStructure(
      action.payload.id,
      true,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.REFRESH_DATASOURCE_STRUCTURE_SUCCESS,
        payload: {
          data: response.data,
          datasourceId: action.payload.id,
        },
      });

      if (isEmpty(response.data)) {
        AppsmithConsole.warning({
          text: "Datasource structure could not be retrieved",
          source: {
            id: action.payload.id,
            name: datasource.name,
            type: ENTITY_TYPE.DATASOURCE,
          },
        });
      } else {
        AppsmithConsole.info({
          text: "Datasource structure retrieved",
          source: {
            id: action.payload.id,
            name: datasource.name,
            type: ENTITY_TYPE.DATASOURCE,
          },
        });
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.REFRESH_DATASOURCE_STRUCTURE_ERROR,
      payload: {
        error,
        show: false,
      },
    });
    AppsmithConsole.error({
      text: "Datasource structure could not be retrieved",
      source: {
        id: action.payload.id,
        name: datasource.name,
        type: ENTITY_TYPE.DATASOURCE,
      },
    });
  }
}

function* executeDatasourceQuerySaga(
  action: executeDatasourceQueryReduxAction<any>,
) {
  try {
    const response: GenericApiResponse<any> = yield DatasourcesApi.executeDatasourceQuery(
      action.payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.EXECUTE_DATASOURCE_QUERY_SUCCESS,
        payload: {
          data: response.data,
          datasourceId: action.payload.datasourceId,
        },
      });
    }
    if (action.onSuccessCallback) {
      action.onSuccessCallback(response);
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.EXECUTE_DATASOURCE_QUERY_ERROR,
      payload: {
        error,
      },
    });
    if (action.onErrorCallback) {
      action.onErrorCallback(error);
    }
  }
}

export function* watchDatasourcesSagas() {
  yield all([
    takeEvery(ReduxActionTypes.FETCH_DATASOURCES_INIT, fetchDatasourcesSaga),
    takeEvery(
      ReduxActionTypes.FETCH_MOCK_DATASOURCES_INIT,
      fetchMockDatasourcesSaga,
    ),
    takeEvery(
      ReduxActionTypes.ADD_MOCK_DATASOURCES_INIT,
      addMockDbToDatasources,
    ),
    takeEvery(
      ReduxActionTypes.CREATE_DATASOURCE_FROM_FORM_INIT,
      createDatasourceFromFormSaga,
    ),
    takeEvery(ReduxActionTypes.UPDATE_DATASOURCE_INIT, updateDatasourceSaga),
    takeEvery(ReduxActionTypes.SAVE_DATASOURCE_NAME, saveDatasourceNameSaga),
    takeEvery(
      ReduxActionErrorTypes.SAVE_DATASOURCE_NAME_ERROR,
      handleDatasourceNameChangeFailureSaga,
    ),
    takeEvery(ReduxActionTypes.TEST_DATASOURCE_INIT, testDatasourceSaga),
    takeEvery(ReduxActionTypes.DELETE_DATASOURCE_INIT, deleteDatasourceSaga),
    takeEvery(ReduxActionTypes.CHANGE_DATASOURCE, changeDatasourceSaga),
    takeLatest(ReduxActionTypes.SWITCH_DATASOURCE, switchDatasourceSaga),
    takeEvery(ReduxActionTypes.STORE_AS_DATASOURCE_INIT, storeAsDatasourceSaga),
    takeEvery(
      ReduxActionTypes.UPDATE_DATASOURCE_SUCCESS,
      updateDatasourceSuccessSaga,
    ),
    takeEvery(
      ReduxActionTypes.REDIRECT_AUTHORIZATION_CODE,
      redirectAuthorizationCodeSaga,
    ),
    takeEvery(ReduxActionTypes.GET_OAUTH_ACCESS_TOKEN, getOAuthAccessTokenSaga),
    takeEvery(
      ReduxActionTypes.FETCH_DATASOURCE_STRUCTURE_INIT,
      fetchDatasourceStructureSaga,
    ),
    takeEvery(
      ReduxActionTypes.REFRESH_DATASOURCE_STRUCTURE_INIT,
      refreshDatasourceStructure,
    ),
    takeEvery(
      ReduxActionTypes.EXECUTE_DATASOURCE_QUERY_INIT,
      executeDatasourceQuerySaga,
    ),
    // Intercepting the redux-form change actionType to update drafts and track change history
    takeEvery(ReduxFormActionTypes.VALUE_CHANGE, formValueChangeSaga),
    takeEvery(ReduxFormActionTypes.ARRAY_PUSH, formValueChangeSaga),
    takeEvery(ReduxFormActionTypes.ARRAY_REMOVE, formValueChangeSaga),
  ]);
}
