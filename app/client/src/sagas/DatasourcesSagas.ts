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
} from "selectors/entitiesSelector";
import {
  changeDatasource,
  createDatasourceFromForm,
  expandDatasourceEntity,
  fetchDatasourceStructure,
  setDatsourceEditorMode,
  updateDatasourceSuccess,
  UpdateDatasourceSuccessAction,
} from "actions/datasourceActions";
import { ApiResponse, GenericApiResponse } from "api/ApiResponses";
import DatasourcesApi, { CreateDatasourceConfig } from "api/DatasourcesApi";
import { Datasource } from "entities/Datasource";

import {
  API_EDITOR_ID_URL,
  DATA_SOURCES_EDITOR_ID_URL,
  DATA_SOURCES_EDITOR_URL,
} from "constants/routes";
import history from "utils/history";
import { API_EDITOR_FORM_NAME, DATASOURCE_DB_FORM } from "constants/forms";
import { validateResponse } from "./ErrorSagas";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getFormData } from "selectors/formSelectors";
import { getCurrentOrgId } from "selectors/organizationSelectors";
import { AppState } from "reducers";
import { Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";
import { getConfigInitialValues } from "components/formControls/utils";
import { setActionProperty } from "actions/actionActions";
import SaasApi from "api/SaasApi";
import { authorizeSaasWithAppsmithToken } from "api/CloudServicesApi";
import {
  createMessage,
  DATASOURCE_CREATE,
  DATASOURCE_DELETE,
  DATASOURCE_UPDATE,
  DATASOURCE_VALID,
  SAAS_APPSMITH_TOKEN_NOT_FOUND,
  SAAS_AUTHORIZATION_APPSMITH_ERROR,
  SAAS_AUTHORIZATION_FAILED,
  SAAS_AUTHORIZATION_SUCCESSFUL,
} from "constants/messages";
import AppsmithConsole from "utils/AppsmithConsole";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import localStorage from "utils/localStorage";
import log from "loglevel";
import { APPSMITH_TOKEN_STORAGE_KEY } from "pages/Editor/SaaSEditor/constants";
import { checkAndGetPluginFormConfigsSaga } from "sagas/PluginSagas";
import { PluginType } from "entities/Action";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { isDynamicValue } from "utils/DynamicBindingUtils";

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
      if (response.data.length) {
        yield put(expandDatasourceEntity(response.data[0].id));
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_DATASOURCES_ERROR,
      payload: { error },
    });
  }
}

export function* deleteDatasourceSaga(
  actionPayload: ReduxActionWithCallbacks<{ id: string }, unknown, unknown>,
) {
  try {
    const id = actionPayload.payload.id;
    const response: GenericApiResponse<Datasource> = yield DatasourcesApi.deleteDatasource(
      id,
    );

    const isValidResponse = yield validateResponse(response);

    if (isValidResponse) {
      const applicationId = yield select(getCurrentApplicationId);
      const pageId = yield select(getCurrentPageId);

      if (
        window.location.pathname ===
        DATA_SOURCES_EDITOR_ID_URL(applicationId, pageId, id)
      ) {
        history.push(DATA_SOURCES_EDITOR_URL(applicationId, pageId));
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
        name: datasource.name,
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
        updateDatasourceSuccess(response.data, !actionPayload.onSuccess),
      );
      if (actionPayload.onSuccess) {
        yield put(actionPayload.onSuccess);
      }
      yield put({
        type: ReduxActionTypes.DELETE_DATASOURCE_DRAFT,
        payload: {
          id: response.data.id,
        },
      });
      yield put(
        setDatsourceEditorMode({ id: datasourcePayload.id, viewMode: true }),
      );

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
  } else if (pluginType === PluginType.SAAS) {
    try {
      // Get an "appsmith token" from the server
      const response: ApiResponse = yield SaasApi.getAppsmithToken(
        datasourceId,
        pageId,
      );
      if (validateResponse(response)) {
        const appsmithToken = response.data;
        // Save the token for later use once we come back from the auth flow
        localStorage.setItem(APPSMITH_TOKEN_STORAGE_KEY, appsmithToken);
        // Redirect to the cloud services to authorise
        window.location.assign(authorizeSaasWithAppsmithToken(appsmithToken));
      }
    } catch (e) {
      Toaster.show({
        text: SAAS_AUTHORIZATION_FAILED,
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
    console.error(SAAS_APPSMITH_TOKEN_NOT_FOUND);
    Toaster.show({
      text: SAAS_AUTHORIZATION_APPSMITH_ERROR,
      variant: Variant.danger,
    });
    return;
  }
  try {
    // Get access token for datasource
    const response = yield SaasApi.getAccessToken(datasourceId, appsmithToken);
    if (validateResponse(response)) {
      // Update the datasource object
      yield put({
        type: ReduxActionTypes.UPDATE_DATASOURCE_SUCCESS,
        payload: response.data,
      });
      Toaster.show({
        text: SAAS_AUTHORIZATION_SUCCESSFUL,
        variant: Variant.success,
      });
      // Remove the token because it is supposed to be short lived
      localStorage.removeItem(APPSMITH_TOKEN_STORAGE_KEY);
    }
  } catch (e) {
    Toaster.show({
      text: SAAS_AUTHORIZATION_FAILED,
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
  }
}

function* changeDatasourceSaga(actionPayload: ReduxAction<Datasource>) {
  const { id } = actionPayload.payload;
  const datasource = actionPayload.payload;
  const draft = yield select(getDatasourceDraft, id);
  const applicationId = yield select(getCurrentApplicationId);
  const pageId = yield select(getCurrentPageId);
  let data;

  if (_.isEmpty(draft)) {
    data = actionPayload.payload;
  } else {
    data = draft;
  }

  yield put(initialize(DATASOURCE_DB_FORM, _.omit(data, ["name"])));

  history.push(
    DATA_SOURCES_EDITOR_ID_URL(applicationId, pageId, datasource.id),
  );
}

function* switchDatasourceSaga(action: ReduxAction<{ datasourceId: string }>) {
  const { datasourceId } = action.payload;
  const datasource = yield select((state: AppState) =>
    state.entities.datasources.list.find(
      (datasource: Datasource) => datasource.id === datasourceId,
    ),
  );
  if (datasource) {
    yield put(changeDatasource(datasource));
  }
}

function* formValueChangeSaga(
  actionPayload: ReduxActionWithMeta<string, { field: string; form: string }>,
) {
  const { field, form } = actionPayload.meta;
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

  yield put(changeDatasource(createdDatasource));
}

function* updateDatasourceSuccessSaga(action: UpdateDatasourceSuccessAction) {
  const state = yield select();
  const actionRouteInfo = _.get(state, "ui.datasourcePane.actionRouteInfo");
  const updatedDatasource = action.payload;

  if (
    actionRouteInfo &&
    updatedDatasource.id === actionRouteInfo.datasourceId &&
    action.redirect
  ) {
    history.push(
      API_EDITOR_ID_URL(
        actionRouteInfo.applicationId,
        actionRouteInfo.pageId,
        actionRouteInfo.apiId,
      ),
    );
  }

  yield put({
    type: ReduxActionTypes.STORE_AS_DATASOURCE_COMPLETE,
  });
}

function* fetchDatasourceStructureSaga(action: ReduxAction<{ id: string }>) {
  const datasource = yield select(getDatasource, action.payload.id);
  try {
    const response: GenericApiResponse<any> = yield DatasourcesApi.fetchDatasourceStructure(
      action.payload.id,
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

export function* watchDatasourcesSagas() {
  yield all([
    takeEvery(ReduxActionTypes.FETCH_DATASOURCES_INIT, fetchDatasourcesSaga),
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
    takeEvery(
      ReduxActionTypes.SAAS_GET_OAUTH_ACCESS_TOKEN,
      getOAuthAccessTokenSaga,
    ),
    takeEvery(
      ReduxActionTypes.FETCH_DATASOURCE_STRUCTURE_INIT,
      fetchDatasourceStructureSaga,
    ),
    takeEvery(
      ReduxActionTypes.REFRESH_DATASOURCE_STRUCTURE_INIT,
      refreshDatasourceStructure,
    ),
    // Intercepting the redux-form change actionType
    takeEvery(ReduxFormActionTypes.VALUE_CHANGE, formValueChangeSaga),
  ]);
}
