import {
  all,
  put,
  takeEvery,
  select,
  call,
  take,
  takeLatest,
} from "redux-saga/effects";
import { change, initialize, getFormValues } from "redux-form";
import _, { merge } from "lodash";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
  ReduxFormActionTypes,
  ReduxActionWithMeta,
  ReduxActionWithCallbacks,
} from "constants/ReduxActionConstants";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import {
  getPluginForm,
  getDatasource,
  getDatasourceDraft,
} from "selectors/entitiesSelector";
import {
  selectPlugin,
  changeDatasource,
  setDatsourceEditorMode,
  expandDatasourceEntity,
  fetchDatasourceStructure,
  createDatasourceFromForm,
} from "actions/datasourceActions";
import { fetchPluginForm } from "actions/pluginActions";
import { GenericApiResponse } from "api/ApiResponses";
import DatasourcesApi, { CreateDatasourceConfig } from "api/DatasourcesApi";
import { Datasource } from "entities/Datasource";
import PluginApi, { DatasourceForm } from "api/PluginApi";

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
import {
  createMessage,
  DATASOURCE_CREATE,
  DATASOURCE_DELETE,
  DATASOURCE_UPDATE,
  DATASOURCE_VALID,
} from "constants/messages";

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
  actionPayload: ReduxAction<{ id: string }>,
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
    }
  } catch (error) {
    Toaster.show({
      text: error.message,
      variant: Variant.danger,
    });
    yield put({
      type: ReduxActionErrorTypes.DELETE_DATASOURCE_ERROR,
      payload: { error, id: actionPayload.payload.id, show: false },
    });
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
      const datasourceStruture =
        state.entities.datasources.structure[response.data.id];

      yield put({
        type: ReduxActionTypes.UPDATE_DATASOURCE_SUCCESS,
        payload: response.data,
      });
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

      if (expandDatasourceId === response.data.id && !datasourceStruture) {
        yield put(fetchDatasourceStructure(response.data.id));
      }
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

function RedirectAuthorizationCodeSaga(
  actionPayload: ReduxAction<{ datasourceId: string; pageId: string }>,
) {
  window.location.href = `/api/v1/datasources/${actionPayload.payload.datasourceId}/pages/${actionPayload.payload.pageId}/code`;
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
    if (isValidResponse) {
      const responseData = response.data;
      if (responseData.invalids && responseData.invalids.length) {
        Toaster.show({
          text: responseData.invalids[0],
          variant: Variant.danger,
        });
        yield put({
          type: ReduxActionErrorTypes.TEST_DATASOURCE_ERROR,
          payload: { show: false },
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
          payload: datasource,
        });
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.TEST_DATASOURCE_ERROR,
      payload: { error, show: false },
    });
  }
}

function* createDatasourceFromFormSaga(
  actionPayload: ReduxAction<CreateDatasourceConfig>,
) {
  try {
    let formConfig;
    const organizationId = yield select(getCurrentOrgId);
    formConfig = yield select(getPluginForm, actionPayload.payload.pluginId);

    if (!formConfig) {
      const formConfigResponse: GenericApiResponse<DatasourceForm> = yield PluginApi.fetchFormConfig(
        actionPayload.payload.pluginId,
      );
      yield validateResponse(formConfigResponse);
      yield put({
        type: ReduxActionTypes.FETCH_PLUGIN_FORM_SUCCESS,
        payload: {
          id: actionPayload.payload.pluginId,
          ...formConfigResponse.data,
        },
      });

      formConfig = yield select(getPluginForm, actionPayload.payload.pluginId);
    }

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
      yield put(
        setDatsourceEditorMode({ id: response.data.id, viewMode: false }),
      );

      const applicationId = yield select(getCurrentApplicationId);
      const pageId = yield select(getCurrentPageId);

      yield put(initialize(DATASOURCE_DB_FORM, _.omit(response.data, "name")));
      history.push(
        DATA_SOURCES_EDITOR_ID_URL(applicationId, pageId, response.data.id),
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
  const { id, pluginId } = actionPayload.payload;
  const datasource = actionPayload.payload;
  const state = yield select();
  const draft = yield select(getDatasourceDraft, id);
  const formConfigs = state.entities.plugins.formConfigs;
  const applicationId = yield select(getCurrentApplicationId);
  const pageId = yield select(getCurrentPageId);
  let data;

  if (_.isEmpty(draft)) {
    data = actionPayload.payload;
  } else {
    data = draft;
  }

  yield put(initialize(DATASOURCE_DB_FORM, _.omit(data, ["name"])));
  yield put(selectPlugin(pluginId));

  if (!formConfigs[pluginId]) {
    yield put(fetchPluginForm({ id: pluginId }));
  }
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
  const { form, field } = actionPayload.meta;
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

  history.push(DATA_SOURCES_EDITOR_URL(applicationId, pageId));

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

function* updateDatasourceSuccessSaga(action: ReduxAction<Datasource>) {
  const state = yield select();
  const actionRouteInfo = _.get(state, "ui.datasourcePane.actionRouteInfo");
  const updatedDatasource = action.payload;

  if (
    actionRouteInfo &&
    updatedDatasource.id === actionRouteInfo.datasourceId
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

function* fetchDatasourceStrucuture(action: ReduxAction<{ id: string }>) {
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
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_DATASOURCE_STRUCTURE_ERROR,
      payload: {
        error,
        show: false,
      },
    });
  }
}

function* refreshDatasourceStrucuture(action: ReduxAction<{ id: string }>) {
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
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.REFRESH_DATASOURCE_STRUCTURE_ERROR,
      payload: {
        error,
        show: false,
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
      RedirectAuthorizationCodeSaga,
    ),
    takeEvery(
      ReduxActionTypes.FETCH_DATASOURCE_STRUCTURE_INIT,
      fetchDatasourceStrucuture,
    ),
    takeEvery(
      ReduxActionTypes.REFRESH_DATASOURCE_STRUCTURE_INIT,
      refreshDatasourceStrucuture,
    ),
    // Intercepting the redux-form change actionType
    takeEvery(ReduxFormActionTypes.VALUE_CHANGE, formValueChangeSaga),
  ]);
}
