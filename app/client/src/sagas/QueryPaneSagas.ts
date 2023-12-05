import {
  all,
  call,
  put,
  select,
  take,
  takeEvery,
  fork,
} from "redux-saga/effects";
import * as Sentry from "@sentry/react";
import type {
  ApplicationPayload,
  ReduxAction,
  ReduxActionWithMeta,
} from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
  ReduxFormActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { getDynamicTriggers, getFormData } from "selectors/formSelectors";
import {
  DATASOURCE_DB_FORM,
  QUERY_EDITOR_FORM_NAME,
} from "@appsmith/constants/forms";
import history from "utils/history";
import { APPLICATIONS_URL, INTEGRATION_TABS } from "constants/routes";
import { getCurrentPageId } from "selectors/editorSelectors";
import { autofill, change, initialize, reset } from "redux-form";
import {
  getAction,
  getDatasource,
  getPluginTemplates,
  getPlugin,
  getEditorConfig,
  getSettingConfig,
  getPlugins,
  getGenerateCRUDEnabledPluginMap,
  getActions,
} from "@appsmith/selectors/entitiesSelector";
import type { Action, QueryAction } from "entities/Action";
import { PluginType } from "entities/Action";
import {
  createActionRequest,
  setActionProperty,
} from "actions/pluginActionActions";
import { getQueryParams } from "utils/URLUtils";
import { isEmpty, merge } from "lodash";
import { getConfigInitialValues } from "components/formControls/utils";
import type { Datasource } from "entities/Datasource";
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
import type { EventLocation } from "@appsmith/utils/analyticsUtilTypes";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  datasourcesEditorIdURL,
  generateTemplateFormURL,
  integrationEditorURL,
  queryEditorIdURL,
} from "@appsmith/RouteBuilder";
import type { GenerateCRUDEnabledPluginMap, Plugin } from "api/PluginApi";
import { UIComponentTypes } from "api/PluginApi";
import { getUIComponent } from "pages/Editor/QueryEditor/helpers";
import { FormDataPaths } from "workers/Evaluation/formEval";
import { fetchDynamicValuesSaga } from "./FormEvaluationSaga";
import type { FormEvalOutput } from "reducers/evaluationReducers/formEvaluationReducer";
import { validateResponse } from "./ErrorSagas";
import { getIsGeneratePageInitiator } from "utils/GenerateCrudUtil";
import { toast } from "design-system";
import type { CreateDatasourceSuccessAction } from "actions/datasourceActions";
import { createDefaultActionPayloadWithPluginDefaults } from "./ActionSagas";
import { DB_NOT_SUPPORTED } from "@appsmith/utils/Environments";
import { getCurrentEnvironmentId } from "@appsmith/selectors/environmentSelectors";
import type { FeatureFlags } from "@appsmith/entities/FeatureFlag";
import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";
import { isGACEnabled } from "@appsmith/utils/planHelpers";
import { getHasManageActionPermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import type { ChangeQueryPayload } from "actions/queryPaneActions";
import { createNewApiName, createNewQueryName } from "utils/AppsmithUtils";
import type { ActionDataState } from "@appsmith/reducers/entityReducers/actionsReducer";
import {
  getApplicationByIdFromWorkspaces,
  getCurrentApplicationIdForCreateNewApp,
} from "@appsmith/selectors/applicationSelectors";
import { TEMP_DATASOURCE_ID } from "constants/Datasource";

// Called whenever the query being edited is changed via the URL or query pane
function* changeQuerySaga(actionPayload: ReduxAction<ChangeQueryPayload>) {
  const { applicationId, id, moduleId, packageId, pageId } =
    actionPayload.payload;
  let configInitialValues = {};

  if (!(packageId && moduleId) && !(applicationId && pageId)) {
    history.push(APPLICATIONS_URL);
    return;
  }
  const action: Action | undefined = yield select(getAction, id);
  if (!action) {
    if (pageId) {
      history.push(
        integrationEditorURL({
          pageId,
          selectedTab: INTEGRATION_TABS.ACTIVE,
        }),
      );
    }
    return;
  }

  // fetching pluginId and the consequent configs from the action
  const pluginId = action.pluginId;
  const currentEditorConfig: any[] = yield select(getEditorConfig, pluginId);
  const currentSettingConfig: any[] = yield select(getSettingConfig, pluginId);

  // Update the evaluations when the queryID is changed by changing the
  // URL or selecting new query from the query pane
  yield put(initFormEvaluations(currentEditorConfig, currentSettingConfig, id));

  const allPlugins: Plugin[] = yield select(getPlugins);
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
    const settingInitialValues: Record<string, unknown> = yield call(
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
        //@ts-expect-error: id does not exists
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

function* formValueChangeSaga(
  actionPayload: ReduxActionWithMeta<string, { field: string; form: string }>,
) {
  try {
    const { field, form } = actionPayload.meta;
    if (field === "dynamicBindingPathList" || field === "name") return;
    if (form !== QUERY_EDITOR_FORM_NAME) return;
    const { values } = yield select(getFormData, QUERY_EDITOR_FORM_NAME);
    const hasRouteChanged = field === "id";

    const featureFlags: FeatureFlags = yield select(selectFeatureFlags);
    const isFeatureEnabled = isGACEnabled(featureFlags);

    if (
      !getHasManageActionPermission(isFeatureEnabled, values.userPermissions)
    ) {
      yield validateResponse({
        status: 403,
        resourceType: values?.pluginType,
        resourceId: values.id,
      });
    }

    // If there is a change in the command type of a form and the value is an empty string, we prevent the command action value from being updated and form evaluations from being performed on it.
    // We do this because by default the command value of an action should always be set to a non empty string value (impossible case).
    if (field === FormDataPaths.COMMAND && actionPayload.payload === "") {
      return;
    }

    const plugins: Plugin[] = yield select(getPlugins);
    const uiComponent = getUIComponent(values.pluginId, plugins);
    const plugin = plugins.find((p) => p.id === values.pluginId);

    if (field === "datasource.id") {
      const datasource: Datasource | undefined = yield select(
        getDatasource,
        actionPayload.payload,
      );

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

      if (
        uiComponent === UIComponentTypes.UQIDbEditorForm &&
        !!values?.id &&
        !!datasource?.id &&
        !!values?.pluginId
      ) {
        // get dynamic triggers that need to be refetched. i.e. allowedToFetch is true.
        const allTriggers: FormEvalOutput | undefined = yield select(
          getDynamicTriggers,
          values.id,
        );

        try {
          // if all triggers exist then set their loading states to true and refetch them.
          if (!!allTriggers) {
            yield put({
              type: ReduxActionTypes.SET_TRIGGER_VALUES_LOADING,
              payload: {
                formId: values.id,
                keys: Object.keys(allTriggers),
                value: true,
              },
            });

            // refetch trigger values.
            yield fork(
              fetchDynamicValuesSaga,
              allTriggers,
              values.id,
              datasource.id,
              values.pluginId,
            );
          }
        } catch (err) {}
      }

      return;
    }

    // get datasource configuration based on datasource id
    // pass it to run form evaluations method
    // This is required for google sheets, as we need to modify query
    // state based on datasource config
    const datasource: Datasource | undefined = yield select(
      getDatasource,
      values.datasource.id,
    );
    const datasourceStorages = datasource?.datasourceStorages || {};

    // Editing form fields triggers evaluations.
    // We pass the action to run form evaluations when the dataTree evaluation is complete
    let currentEnvironment: string = yield select(getCurrentEnvironmentId);
    const pluginType = plugin?.type;
    if (
      (!!pluginType && DB_NOT_SUPPORTED.includes(pluginType)) ||
      !datasourceStorages.hasOwnProperty(currentEnvironment) ||
      !datasourceStorages[currentEnvironment].hasOwnProperty(
        "datasourceConfiguration",
      )
    ) {
      currentEnvironment = Object.keys(datasourceStorages)[0];
    }
    const postEvalActions =
      uiComponent === UIComponentTypes.UQIDbEditorForm
        ? [
            startFormEvaluations(
              values.id,
              values.actionConfiguration,
              values.datasource.id,
              values.pluginId,
              field,
              hasRouteChanged,
              datasourceStorages[currentEnvironment].datasourceConfiguration,
            ),
          ]
        : [];

    if (
      actionPayload.type === ReduxFormActionTypes.ARRAY_REMOVE ||
      actionPayload.type === ReduxFormActionTypes.ARRAY_PUSH
    ) {
      const value = get(values, field);
      yield put(
        setActionProperty(
          {
            actionId: values.id,
            propertyName: field,
            value,
          },
          postEvalActions,
        ),
      );
    } else {
      yield put(
        setActionProperty(
          {
            actionId: values.id,
            propertyName: field,
            value: actionPayload.payload,
          },
          postEvalActions,
        ),
      );
    }
    yield put(updateReplayEntity(values.id, values, ENTITY_TYPE.ACTION));
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.SAVE_PAGE_ERROR,
      payload: {
        error,
      },
    });
    yield put(reset(QUERY_EDITOR_FORM_NAME));
  }
}

function* handleQueryCreatedSaga(actionPayload: ReduxAction<QueryAction>) {
  const { actionConfiguration, id, pageId, pluginId, pluginType } =
    actionPayload.payload;
  if (![PluginType.DB, PluginType.REMOTE, PluginType.AI].includes(pluginType))
    return;
  const pluginTemplates: Record<string, unknown> =
    yield select(getPluginTemplates);
  const queryTemplate = pluginTemplates[pluginId];
  // Do not show template view if the query has body(code) or if there are no templates or if the plugin is MongoDB
  const showTemplate = !(
    !!actionConfiguration.body ||
    !!actionConfiguration.formData?.body ||
    isEmpty(queryTemplate)
  );
  history.replace(
    queryEditorIdURL({
      pageId,
      queryId: id,
      params: {
        editName: "true",
        showTemplate,
        from: "datasources",
      },
    }),
  );
}

function* handleDatasourceCreatedSaga(
  actionPayload: CreateDatasourceSuccessAction,
) {
  const { isDBCreated, payload } = actionPayload;
  const plugin: Plugin | undefined = yield select(getPlugin, payload.pluginId);
  // Only look at db plugins
  if (
    plugin &&
    plugin.type !== PluginType.DB &&
    plugin.type !== PluginType.REMOTE &&
    plugin.type !== PluginType.AI
  )
    return;

  const currentApplicationIdForCreateNewApp: string | undefined = yield select(
    getCurrentApplicationIdForCreateNewApp,
  );
  const application: ApplicationPayload | undefined = yield select(
    getApplicationByIdFromWorkspaces,
    currentApplicationIdForCreateNewApp || "",
  );
  const pageId: string = !!currentApplicationIdForCreateNewApp
    ? application?.defaultPageId
    : yield select(getCurrentPageId);

  yield put(initialize(DATASOURCE_DB_FORM, omit(payload, "name")));

  const queryParams = getQueryParams();
  const updatedDatasource = payload;

  const isGeneratePageInitiator = getIsGeneratePageInitiator(
    queryParams.isGeneratePageMode,
  );
  const generateCRUDSupportedPlugin: GenerateCRUDEnabledPluginMap =
    yield select(getGenerateCRUDEnabledPluginMap);

  // isGeneratePageInitiator ensures that datasource is being created from generate page with data
  // then we check if the current plugin is supported for generate page with data functionality
  // and finally isDBCreated ensures that datasource is not in temporary state and
  // user has explicitly saved the datasource, before redirecting back to generate page
  if (
    isGeneratePageInitiator &&
    updatedDatasource.pluginId &&
    generateCRUDSupportedPlugin[updatedDatasource.pluginId] &&
    isDBCreated
  ) {
    history.push(
      generateTemplateFormURL({
        pageId,
        params: {
          datasourceId: updatedDatasource.id,
        },
      }),
    );
  } else if (
    !currentApplicationIdForCreateNewApp ||
    (!!currentApplicationIdForCreateNewApp && payload.id !== TEMP_DATASOURCE_ID)
  ) {
    history.push(
      datasourcesEditorIdURL({
        pageId,
        datasourceId: payload.id,
        params: {
          from: "datasources",
          ...getQueryParams(),
          pluginId: plugin?.id,
        },
      }),
    );
  }
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
  const actionObj: Action | undefined = yield select(getAction, actionId);
  yield take(ReduxActionTypes.FETCH_ACTIONS_FOR_PAGE_SUCCESS);
  if (!actionObj) {
    // Error case, log to sentry
    toast.show(createMessage(ERROR_ACTION_RENAME_FAIL, ""), {
      kind: "error",
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
        pageId: actionObj.pageId,
        queryId: actionId,
        params,
      }),
    );
  }
}

/**
 * Creates an action with specific datasource created by a user
 * @param action
 */
function* createNewQueryForDatasourceSaga(
  action: ReduxAction<{
    pageId: string;
    datasourceId: string;
    from: EventLocation;
  }>,
) {
  const { datasourceId, from, pageId } = action.payload;
  if (!datasourceId) return;

  const actions: ActionDataState = yield select(getActions);
  const datasource: Datasource = yield select(getDatasource, datasourceId);
  const plugin: Plugin = yield select(getPlugin, datasource?.pluginId);
  const newActionName =
    plugin?.type === PluginType.DB
      ? createNewQueryName(actions, pageId || "")
      : createNewApiName(actions, pageId || "");

  const createActionPayload: Partial<Action> = yield call(
    createDefaultActionPayloadWithPluginDefaults,
    {
      datasourceId,
      from,
      newActionName,
    },
  );

  yield put(
    createActionRequest({
      ...createActionPayload,
      pageId: action.payload.pageId,
    }),
  );
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
