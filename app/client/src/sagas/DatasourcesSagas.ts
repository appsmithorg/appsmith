import { all, put, takeEvery, select, call, take } from "redux-saga/effects";
import { change, initialize, getFormValues } from "redux-form";
import _ from "lodash";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
  ReduxFormActionTypes,
  ReduxActionWithMeta,
} from "constants/ReduxActionConstants";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import {
  getDatasourceRefs,
  getPluginForm,
  getDatasource,
  getDatasourceDraft,
} from "selectors/entitiesSelector";
import {
  selectPlugin,
  createDatasource,
  changeDatasource,
} from "actions/datasourceActions";
import { fetchPluginForm } from "actions/pluginActions";
import { GenericApiResponse } from "api/ApiResponses";
import DatasourcesApi, {
  CreateDatasourceConfig,
  Datasource,
} from "api/DatasourcesApi";
import PluginApi, { DatasourceForm } from "api/PluginApi";

import {
  DATA_SOURCES_EDITOR_ID_URL,
  DATA_SOURCES_EDITOR_URL,
} from "constants/routes";
import history from "utils/history";
import { API_EDITOR_FORM_NAME, DATASOURCE_DB_FORM } from "constants/forms";
import { validateResponse } from "./ErrorSagas";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { AppToaster } from "components/editorComponents/ToastComponent";
import { ToastType } from "react-toastify";
import { getFormData } from "selectors/formSelectors";
import { changeApi, setDatasourceFieldText } from "actions/apiPaneActions";
import { getCurrentOrgId } from "selectors/organizationSelectors";

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

function* createDatasourceSaga(
  actionPayload: ReduxAction<CreateDatasourceConfig>,
) {
  try {
    const organizationId = yield select(getCurrentOrgId);
    const response: GenericApiResponse<Datasource> = yield DatasourcesApi.createDatasource(
      {
        ...actionPayload.payload,
        organizationId,
      },
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      AnalyticsUtil.logEvent("SAVE_DATA_SOURCE", {
        dataSourceName: actionPayload.payload.name,
        appName: actionPayload.payload.appName,
      });
      yield put({
        type: ReduxActionTypes.CREATE_DATASOURCE_SUCCESS,
        payload: response.data,
      });
      yield put(change(API_EDITOR_FORM_NAME, "datasource", response.data));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_DATASOURCE_ERROR,
      payload: { error },
    });
  }
}

export function* deleteDatasourceSaga(
  actionPayload: ReduxAction<{ id: string }>,
) {
  try {
    const applicationId = yield select(getCurrentApplicationId);
    const pageId = yield select(getCurrentPageId);
    const id = actionPayload.payload.id;
    const response: GenericApiResponse<Datasource> = yield DatasourcesApi.deleteDatasource(
      id,
    );

    const isValidResponse = yield validateResponse(response);

    if (isValidResponse) {
      AppToaster.show({
        message: `${response.data.name} datasource deleted`,
        type: ToastType.SUCCESS,
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
      history.push(DATA_SOURCES_EDITOR_URL(applicationId, pageId));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.DELETE_DATASOURCE_ERROR,
      payload: { error, id: actionPayload.payload.id },
    });
  }
}

function* updateDatasourceSaga(actionPayload: ReduxAction<Datasource>) {
  try {
    const response: GenericApiResponse<Datasource> = yield DatasourcesApi.updateDatasource(
      actionPayload.payload,
      actionPayload.payload.id,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      AppToaster.show({
        message: `${actionPayload.payload.name} Datasource updated`,
        type: ToastType.SUCCESS,
      });
      yield put({
        type: ReduxActionTypes.UPDATE_DATASOURCE_SUCCESS,
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
    yield put({
      type: ReduxActionErrorTypes.UPDATE_DATASOURCE_ERROR,
      payload: { error },
    });
  }
}

function* testDatasourceSaga(actionPayload: ReduxAction<Datasource>) {
  const organizationId = yield select(getCurrentOrgId);
  const { initialValues, values } = yield select(
    getFormData,
    DATASOURCE_DB_FORM,
  );
  const payload = { ...actionPayload.payload };

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
        AppToaster.show({
          message: responseData.invalids[0],
          type: ToastType.ERROR,
        });
      } else {
        AppToaster.show({
          message: `${actionPayload.payload.name} is valid`,
          type: ToastType.SUCCESS,
        });
      }
      yield put({
        type: ReduxActionTypes.TEST_DATASOURCE_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.TEST_DATASOURCE_ERROR,
      payload: { error },
    });
  }
}

function* createDatasourceFromFormSaga(
  actionPayload: ReduxAction<CreateDatasourceConfig>,
) {
  try {
    let formConfig;
    const organizationId = yield select(getCurrentOrgId);
    const initialValues = {};
    const parseConfig = (section: any): any => {
      return _.map(section.children, (subSection: any) => {
        if ("children" in subSection) {
          return parseConfig(subSection);
        }

        if (subSection.initialValue) {
          _.set(
            initialValues,
            subSection.configProperty,
            subSection.initialValue,
          );
        }
      });
    };
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
          form: formConfigResponse.data.form,
        },
      });

      formConfig = yield select(getPluginForm, actionPayload.payload.pluginId);
    }

    formConfig.forEach((section: any) => {
      parseConfig(section);
    });

    const payload = {
      ...initialValues,
      ...actionPayload.payload,
    };

    const response: GenericApiResponse<Datasource> = yield DatasourcesApi.createDatasource(
      {
        ...payload,
        organizationId,
      },
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      AnalyticsUtil.logEvent("SAVE_DATA_SOURCE", {
        dataSourceName: actionPayload.payload.name,
        appName: actionPayload.payload.appName,
      });
      yield put({
        type: ReduxActionTypes.UPDATE_DATASOURCE_REFS,
        payload: response.data,
      });
      yield put({
        type: ReduxActionTypes.CREATE_DATASOURCE_SUCCESS,
        payload: response.data,
      });

      const applicationId = yield select(getCurrentApplicationId);
      const pageId = yield select(getCurrentPageId);

      yield put(initialize(DATASOURCE_DB_FORM, response.data));
      history.push(
        DATA_SOURCES_EDITOR_ID_URL(applicationId, pageId, response.data.id),
      );
      AppToaster.show({
        message: `${actionPayload.payload.name} Datasource created`,
        type: ToastType.SUCCESS,
      });

      const datasourceRefs = yield select(getDatasourceRefs);

      datasourceRefs[response.data.id].current.scrollIntoView({
        behavior: "smooth",
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

  yield put(initialize(DATASOURCE_DB_FORM, data));
  yield put(selectPlugin(pluginId));

  if (!formConfigs[pluginId]) {
    yield put(fetchPluginForm({ id: pluginId }));
  }
  history.push(
    DATA_SOURCES_EDITOR_ID_URL(applicationId, pageId, datasource.id),
  );
}

function* formValueChangeSaga(
  actionPayload: ReduxActionWithMeta<string, { field: string; form: string }>,
) {
  const { form } = actionPayload.meta;
  if (form !== DATASOURCE_DB_FORM) return;
  yield all([call(updateDraftsSaga)]);
}

function* storeAsDatasourceSaga() {
  const { values } = yield select(getFormData, API_EDITOR_FORM_NAME);
  const applicationId = yield select(getCurrentApplicationId);
  const pageId = yield select(getCurrentPageId);
  let datasource = _.get(values, "datasource");
  datasource = _.omit(datasource, ["name"]);

  history.push(DATA_SOURCES_EDITOR_URL(applicationId, pageId));

  yield put(createDatasource(datasource));
  const createDatasourceSuccessAction = yield take(
    ReduxActionTypes.CREATE_DATASOURCE_SUCCESS,
  );
  const createdDatasource = createDatasourceSuccessAction.payload;

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
    const { apiId } = actionRouteInfo;

    yield put(setDatasourceFieldText(apiId, ""));
    yield put(changeApi(apiId));
  }

  yield put({
    type: ReduxActionTypes.STORE_AS_DATASOURCE_COMPLETE,
  });
}

export function* watchDatasourcesSagas() {
  yield all([
    takeEvery(ReduxActionTypes.FETCH_DATASOURCES_INIT, fetchDatasourcesSaga),
    takeEvery(ReduxActionTypes.CREATE_DATASOURCE_INIT, createDatasourceSaga),
    takeEvery(
      ReduxActionTypes.CREATE_DATASOURCE_FROM_FORM_INIT,
      createDatasourceFromFormSaga,
    ),
    takeEvery(ReduxActionTypes.UPDATE_DATASOURCE_INIT, updateDatasourceSaga),
    takeEvery(ReduxActionTypes.TEST_DATASOURCE_INIT, testDatasourceSaga),
    takeEvery(ReduxActionTypes.DELETE_DATASOURCE_INIT, deleteDatasourceSaga),
    takeEvery(ReduxActionTypes.CHANGE_DATASOURCE, changeDatasourceSaga),
    takeEvery(ReduxActionTypes.STORE_AS_DATASOURCE_INIT, storeAsDatasourceSaga),
    takeEvery(
      ReduxActionTypes.UPDATE_DATASOURCE_SUCCESS,
      updateDatasourceSuccessSaga,
    ),
    // Intercepting the redux-form change actionType
    takeEvery(ReduxFormActionTypes.VALUE_CHANGE, formValueChangeSaga),
  ]);
}
