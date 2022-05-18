import { all, call, put, select, take, takeEvery } from "redux-saga/effects";
import * as Sentry from "@sentry/react";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
  ReduxActionWithMeta,
  ReduxFormActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { getFormData } from "selectors/formSelectors";
import { DATASOURCE_DB_FORM, QUERY_EDITOR_FORM_NAME } from "constants/forms";
import history from "utils/history";
import { APPLICATIONS_URL, INTEGRATION_TABS } from "constants/routes";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { autofill, change, initialize } from "redux-form";
import {
  getAction,
  getDatasource,
  getPluginTemplates,
  getPlugin,
  getEditorConfig,
  getSettingConfig,
  getActions,
  getPlugins,
} from "selectors/entitiesSelector";
import {
  ApiActionConfig,
  isGraphqlPlugin,
  PluginType,
  QueryAction,
} from "entities/Action";
import {
  createActionRequest,
  setActionProperty,
} from "actions/pluginActionActions";
import {
  createNewApiName,
  createNewQueryName,
  getQueryParams,
} from "utils/AppsmithUtils";
import { isEmpty, merge } from "lodash";
import { getConfigInitialValues } from "components/formControls/utils";
import { Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";
import { Datasource } from "entities/Datasource";
import omit from "lodash/omit";
import {
  createMessage,
  ERROR_ACTION_RENAME_FAIL,
} from "@appsmith/constants/messages";
import get from "lodash/get";
import {
  initFormEvaluations,
  startFormEvaluations,
} from "actions/evaluationActions";
import { updateReplayEntity } from "actions/pageActions";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import AnalyticsUtil, { EventLocation } from "utils/AnalyticsUtil";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import {
  datasourcesEditorIdURL,
  integrationEditorURL,
  queryEditorIdURL,
} from "RouteBuilder";
import { Plugin, UIComponentTypes } from "api/PluginApi";
import { getUIComponent } from "pages/Editor/QueryEditor/helpers";
import {
  DEFAULT_API_ACTION_CONFIG,
  DEFAULT_GRAPHQL_ACTION_CONFIG,
} from "constants/ApiEditorConstants";

// Called whenever the query being edited is changed via the URL or query pane
function* changeQuerySaga(
  actionPayload: ReduxAction<{ id: string; isSaas: boolean }>,
) {
  const { id, isSaas } = actionPayload.payload;
  let configInitialValues = {};
  const applicationId: string = yield select(getCurrentApplicationId);
  const pageId: string = yield select(getCurrentPageId);
  if (!applicationId || !pageId) {
    history.push(APPLICATIONS_URL);
    return;
  }
  const action = yield select(getAction, id);
  if (!action) {
    history.push(
      integrationEditorURL({
        selectedTab: INTEGRATION_TABS.ACTIVE,
      }),
    );
    return;
  }

  if (isSaas) {
    yield put(initialize(QUERY_EDITOR_FORM_NAME, action));
  } else {
    // fetching pluginId and the consequent configs from the action
    const pluginId = action.pluginId;
    const currentEditorConfig: any[] = yield select(getEditorConfig, pluginId);
    const currentSettingConfig: any[] = yield select(
      getSettingConfig,
      pluginId,
    );

    // Update the evaluations when the queryID is changed by changing the
    // URL or selecting new query from the query pane
    yield put(
      initFormEvaluations(currentEditorConfig, currentSettingConfig, id),
    );

    const allPlugins = yield select(getPlugins);
    let uiComponent = UIComponentTypes.DbEditorForm;
    if (!!pluginId) uiComponent = getUIComponent(pluginId, allPlugins);

    // If config exists
    if (currentEditorConfig) {
      // Get initial values
      configInitialValues = yield call(
        getConfigInitialValues,
        currentEditorConfig,
        uiComponent === UIComponentTypes.UQIDbEditorForm,
      );
    }

    if (currentSettingConfig) {
      const settingInitialValues = yield call(
        getConfigInitialValues,
        currentSettingConfig,
        uiComponent === UIComponentTypes.UQIDbEditorForm,
      );
      configInitialValues = merge(configInitialValues, settingInitialValues);
    }

    // Merge the initial values and action.
    const formInitialValues = merge(configInitialValues, action);

    // Set the initialValues in the state for redux-form lib
    yield put(initialize(QUERY_EDITOR_FORM_NAME, formInitialValues));

    if (uiComponent === UIComponentTypes.UQIDbEditorForm) {
      // Once the initial values are set, we can run the evaluations based on them.
      yield put(
        startFormEvaluations(
          id,
          formInitialValues.actionConfiguration,
          action.datasource.id,
          pluginId,
        ),
      );
    }

    yield put(
      updateReplayEntity(
        formInitialValues.id,
        formInitialValues,
        ENTITY_TYPE.ACTION,
      ),
    );
  }
}

function* formValueChangeSaga(
  actionPayload: ReduxActionWithMeta<string, { field: string; form: string }>,
) {
  const { field, form } = actionPayload.meta;
  if (field === "dynamicBindingPathList" || field === "name") return;
  if (form !== QUERY_EDITOR_FORM_NAME) return;
  const { values } = yield select(getFormData, QUERY_EDITOR_FORM_NAME);

  if (field === "datasource.id") {
    const datasource = yield select(getDatasource, actionPayload.payload);

    // Update the datasource not just the datasource id.
    yield put(
      setActionProperty({
        actionId: values.id,
        propertyName: "datasource",
        value: datasource,
      }),
    );

    // Update the datasource of the form as well
    yield put(autofill(QUERY_EDITOR_FORM_NAME, "datasource", datasource));

    AnalyticsUtil.logEvent("SWITCH_DATASOURCE");

    return;
  }

  if (
    actionPayload.type === ReduxFormActionTypes.ARRAY_REMOVE ||
    actionPayload.type === ReduxFormActionTypes.ARRAY_PUSH
  ) {
    const value = get(values, field);
    yield put(
      setActionProperty({
        actionId: values.id,
        propertyName: field,
        value,
      }),
    );
  } else {
    yield put(
      setActionProperty({
        actionId: values.id,
        propertyName: field,
        value: actionPayload.payload,
      }),
    );
  }
  yield put(updateReplayEntity(values.id, values, ENTITY_TYPE.ACTION));
}

function* handleQueryCreatedSaga(actionPayload: ReduxAction<QueryAction>) {
  const {
    actionConfiguration,
    id,
    pluginId,
    pluginType,
  } = actionPayload.payload;
  if (pluginType === PluginType.DB || pluginType === PluginType.REMOTE) {
    yield put(initialize(QUERY_EDITOR_FORM_NAME, actionPayload.payload));
    const pluginTemplates = yield select(getPluginTemplates);
    const queryTemplate = pluginTemplates[pluginId];
    // Do not show template view if the query has body(code) or if there are no templates
    const showTemplate = !(
      !!actionConfiguration.body ||
      !!actionConfiguration.formData?.body ||
      isEmpty(queryTemplate)
    );
    history.replace(
      queryEditorIdURL({
        queryId: id,
        params: {
          editName: "true",
          showTemplate,
          from: "datasources",
        },
      }),
    );
  }
}

function* handleDatasourceCreatedSaga(actionPayload: ReduxAction<Datasource>) {
  const plugin = yield select(getPlugin, actionPayload.payload.pluginId);
  // Only look at db plugins
  if (plugin.type !== PluginType.DB && plugin.type !== PluginType.REMOTE)
    return;

  yield put(
    initialize(DATASOURCE_DB_FORM, omit(actionPayload.payload, "name")),
  );
  history.push(
    datasourcesEditorIdURL({
      datasourceId: actionPayload.payload.id,
      params: { from: "datasources", ...getQueryParams() },
    }),
  );
}

function* handleNameChangeSaga(
  action: ReduxAction<{ id: string; name: string }>,
) {
  yield put(change(QUERY_EDITOR_FORM_NAME, "name", action.payload.name));
}

function* handleNameChangeSuccessSaga(
  action: ReduxAction<{ actionId: string }>,
) {
  const { actionId } = action.payload;
  const actionObj = yield select(getAction, actionId);
  yield take(ReduxActionTypes.FETCH_ACTIONS_FOR_PAGE_SUCCESS);
  if (!actionObj) {
    // Error case, log to sentry
    Toaster.show({
      text: createMessage(ERROR_ACTION_RENAME_FAIL, ""),
      variant: Variant.danger,
    });

    Sentry.captureException(
      new Error(createMessage(ERROR_ACTION_RENAME_FAIL, "")),
      {
        extra: {
          actionId: actionId,
        },
      },
    );
    return;
  }
  if (actionObj.pluginType === PluginType.DB) {
    const params = getQueryParams();
    if (params.editName) {
      params.editName = "false";
    }
    history.replace(
      queryEditorIdURL({
        queryId: actionId,
        params,
      }),
    );
  }
}

function* createNewQueryForDatasourceSaga(
  action: ReduxAction<{
    pageId: string;
    datasourceId: string;
    from: EventLocation;
  }>,
) {
  const { datasourceId, pageId } = action.payload;
  if (!datasourceId) return;
  const datasource: Datasource = yield select(getDatasource, datasourceId);
  const actions: ActionDataState = yield select(getActions);

  const plugin: Plugin = yield select(getPlugin, datasource?.pluginId);
  const pluginType: PluginType = plugin?.type;
  const isGraphql: boolean = isGraphqlPlugin(plugin);

  // If the datasource is Graphql then get Graphql default config else Api config
  const DEFAULT_CONFIG = isGraphql
    ? DEFAULT_GRAPHQL_ACTION_CONFIG
    : DEFAULT_API_ACTION_CONFIG;

  const DEFAULT_HEADERS = isGraphql
    ? DEFAULT_GRAPHQL_ACTION_CONFIG.headers
    : DEFAULT_API_ACTION_CONFIG.headers;

  /* Removed Datasource Headers because they already exists in inherited headers so should not be duplicated to Newer APIs creation as datasource is already attached to it. While for older APIs we can start showing message on the UI from the API from messages key in Actions object. */
  const defaultApiActionConfig: ApiActionConfig = {
    ...DEFAULT_CONFIG,
    headers: DEFAULT_HEADERS,
  };

  const newActionName =
    pluginType === PluginType.DB
      ? createNewQueryName(actions, pageId || "")
      : createNewApiName(actions, pageId || "");

  const createActionPayload = {
    name: newActionName,
    pageId,
    pluginId: datasource?.pluginId,
    datasource: {
      id: datasourceId,
    },
    eventData: {
      actionType: pluginType === PluginType.DB ? "Query" : "API",
      from: action.payload.from,
      dataSource: datasource.name,
    },
    actionConfiguration:
      plugin?.type === PluginType.API ? defaultApiActionConfig : {},
  };

  yield put(createActionRequest(createActionPayload));
}

function* handleNameChangeFailureSaga(
  action: ReduxAction<{ oldName: string }>,
) {
  yield put(change(QUERY_EDITOR_FORM_NAME, "name", action.payload.oldName));
}

export default function* root() {
  yield all([
    takeEvery(ReduxActionTypes.CREATE_ACTION_SUCCESS, handleQueryCreatedSaga),
    takeEvery(
      ReduxActionTypes.CREATE_DATASOURCE_SUCCESS,
      handleDatasourceCreatedSaga,
    ),
    takeEvery(ReduxActionTypes.QUERY_PANE_CHANGE, changeQuerySaga),
    takeEvery(ReduxActionTypes.SAVE_ACTION_NAME_INIT, handleNameChangeSaga),
    takeEvery(
      ReduxActionTypes.SAVE_ACTION_NAME_SUCCESS,
      handleNameChangeSuccessSaga,
    ),
    takeEvery(
      ReduxActionErrorTypes.SAVE_ACTION_NAME_ERROR,
      handleNameChangeFailureSaga,
    ),
    // Intercepting the redux-form change actionType
    takeEvery(ReduxFormActionTypes.VALUE_CHANGE, formValueChangeSaga),
    takeEvery(ReduxFormActionTypes.ARRAY_REMOVE, formValueChangeSaga),
    takeEvery(ReduxFormActionTypes.ARRAY_PUSH, formValueChangeSaga),
    takeEvery(
      ReduxActionTypes.CREATE_NEW_QUERY_ACTION,
      createNewQueryForDatasourceSaga,
    ),
  ]);
}
