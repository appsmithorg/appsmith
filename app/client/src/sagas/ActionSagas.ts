import type {
  EvaluationReduxAction,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  all,
  call,
  fork,
  put,
  race,
  select,
  take,
  takeEvery,
  takeLatest,
} from "redux-saga/effects";
import type { Datasource, DatasourceStructure } from "entities/Datasource";
import type { ActionCreateUpdateResponse } from "api/ActionAPI";
import ActionAPI from "api/ActionAPI";
import type { ApiResponse } from "api/ApiResponses";
import type { FetchPageRequest, FetchPageResponse } from "api/PageApi";
import PageApi from "api/PageApi";
import { updateCanvasWithDSL } from "@appsmith/sagas/PageSagas";
import type {
  FetchActionsPayload,
  SetActionPropertyPayload,
} from "actions/pluginActionActions";
import {
  copyActionError,
  copyActionSuccess,
  createActionSuccess,
  deleteActionSuccess,
  fetchActionsForPage,
  fetchActionsForPageSuccess,
  moveActionError,
  moveActionSuccess,
  updateAction,
  updateActionData,
  updateActionProperty,
  updateActionSuccess,
} from "actions/pluginActionActions";
import { getDynamicBindingsChangesSaga } from "utils/DynamicBindingUtils";
import { validateResponse } from "./ErrorSagas";
import { transformRestAction } from "transformers/RestActionTransformer";
import { getCurrentPageId } from "selectors/editorSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import type {
  Action,
  ActionViewMode,
  ApiAction,
  ApiActionConfig,
  CreateActionDefaultsParams,
  SlashCommandPayload,
} from "entities/Action";
import { isGraphqlPlugin } from "entities/Action";
import {
  isAPIAction,
  PluginPackageName,
  PluginType,
  SlashCommand,
} from "entities/Action";
import type { ActionData } from "@appsmith/reducers/entityReducers/actionsReducer";
import {
  getAction,
  getCurrentPageNameByActionId,
  getDatasource,
  getDatasourceStructureById,
  getDatasources,
  getEditorConfig,
  getPageNameByPageId,
  getPlugin,
  getSettingConfig,
} from "@appsmith/selectors/entitiesSelector";
import history from "utils/history";
import { INTEGRATION_TABS } from "constants/routes";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import {
  ACTION_COPY_SUCCESS,
  ACTION_MOVE_SUCCESS,
  createMessage,
  ERROR_ACTION_COPY_FAIL,
  ERROR_ACTION_MOVE_FAIL,
  ERROR_ACTION_RENAME_FAIL,
} from "@appsmith/constants/messages";
import { get, isEmpty, merge } from "lodash";
import {
  fixActionPayloadForMongoQuery,
  getConfigInitialValues,
} from "components/formControls/utils";
import AppsmithConsole from "utils/AppsmithConsole";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import {
  createNewApiAction,
  createNewQueryAction,
} from "actions/apiPaneActions";
import type { Plugin } from "api/PluginApi";
import * as log from "loglevel";
import { shouldBeDefined } from "utils/helpers";
import {
  apiEditorIdURL,
  builderURL,
  integrationEditorURL,
  queryEditorIdURL,
  saasEditorApiIdURL,
} from "@appsmith/RouteBuilder";
import {
  RequestPayloadAnalyticsPath,
  checkAndLogErrorsIfCyclicDependency,
  enhanceRequestPayloadWithEventData,
} from "./helper";
import { setSnipingMode as setSnipingModeAction } from "actions/propertyPaneActions";
import { toast } from "design-system";
import { getFormValues } from "redux-form";
import {
  API_EDITOR_FORM_NAME,
  QUERY_EDITOR_FORM_NAME,
} from "@appsmith/constants/forms";
import { DEFAULT_GRAPHQL_ACTION_CONFIG } from "constants/ApiEditorConstants/GraphQLEditorConstants";
import { DEFAULT_API_ACTION_CONFIG } from "constants/ApiEditorConstants/ApiEditorConstants";
import { fetchDatasourceStructure } from "actions/datasourceActions";
import { setAIPromptTriggered } from "utils/storage";
import { getDefaultTemplateActionConfig } from "utils/editorContextUtils";
import { sendAnalyticsEventSaga } from "./AnalyticsSaga";
import { EditorModes } from "components/editorComponents/CodeEditor/EditorConfig";
import { updateActionAPICall } from "@appsmith/sagas/ApiCallerSagas";
import { getIsServerDSLMigrationsEnabled } from "selectors/pageSelectors";

export function* createDefaultActionPayloadWithPluginDefaults(
  props: CreateActionDefaultsParams,
) {
  const actionDefaults: Partial<Action> = yield call(
    createDefaultActionPayload,
    props,
  );

  if (actionDefaults.pluginId) {
    const pluginDefaults: Partial<Record<string, unknown>> = yield call(
      getPluginActionDefaultValues,
      actionDefaults.pluginId,
    );
    return merge({}, pluginDefaults, actionDefaults);
  }

  return actionDefaults;
}

export function* createDefaultActionPayload({
  datasourceId,
  from,
  newActionName,
}: CreateActionDefaultsParams) {
  const datasource: Datasource = yield select(getDatasource, datasourceId);
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

  const dsStructure: DatasourceStructure | undefined = yield select(
    getDatasourceStructureById,
    datasource?.id,
  );

  const defaultActionConfig: any = getDefaultTemplateActionConfig(
    plugin,
    dsStructure,
    datasource?.isMock,
  );

  const defaultAction: Partial<Action> = {
    pluginId: datasource?.pluginId,
    datasource: {
      id: datasourceId,
    },
    eventData: {
      actionType: pluginType === PluginType.DB ? "Query" : "API",
      from: from,
      dataSource: datasource.name,
      datasourceId: datasourceId,
      pluginName: plugin?.name,
      isMock: !!datasource?.isMock,
    },
    actionConfiguration:
      plugin?.type === PluginType.API
        ? defaultApiActionConfig
        : !!defaultActionConfig
        ? defaultActionConfig
        : {},
    name: newActionName,
  };

  return defaultAction;
}

export function* getPluginActionDefaultValues(pluginId: string) {
  if (!pluginId) {
    return;
  }
  const editorConfig: any[] = yield select(getEditorConfig, pluginId);

  const settingConfig: any[] = yield select(getSettingConfig, pluginId);

  let initialValues: Record<string, unknown> = yield call(
    getConfigInitialValues,
    editorConfig,
  );
  if (settingConfig) {
    const settingInitialValues: Record<string, unknown> = yield call(
      getConfigInitialValues,
      settingConfig,
    );
    initialValues = merge(initialValues, settingInitialValues);
  }
  return initialValues;
}

export function* createActionSaga(
  actionPayload: ReduxAction<
    Partial<Action> & { eventData: any; pluginId: string }
  >,
) {
  try {
    const payload = actionPayload.payload;

    const response: ApiResponse<ActionCreateUpdateResponse> =
      yield ActionAPI.createAction(payload);
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      const pageName: string = yield select(
        getCurrentPageNameByActionId,
        response.data.id,
      );

      AnalyticsUtil.logEvent("CREATE_ACTION", {
        id: response.data.id,
        // @ts-expect-error: name does not exists on type ActionCreateUpdateResponse
        actionName: response.data.name,
        pageName: pageName,
        ...actionPayload.payload.eventData,
      });

      AppsmithConsole.info({
        text: `Action created`,
        source: {
          type: ENTITY_TYPE.ACTION,
          id: response.data.id,
          // @ts-expect-error: name does not exists on type ActionCreateUpdateResponse
          name: response.data.name,
        },
      });

      const newAction = response.data;
      // @ts-expect-error: type mismatch ActionCreateUpdateResponse vs Action
      yield put(createActionSuccess(newAction));

      // we fork to prevent the call from blocking
      yield fork(fetchActionDatasourceStructure, newAction);
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_ACTION_ERROR,
      payload: actionPayload.payload,
    });
  }
}

function* fetchActionDatasourceStructure(action: ActionCreateUpdateResponse) {
  if (action.datasource?.id) {
    const doesDatasourceStructureAlreadyExist: DatasourceStructure =
      yield select(getDatasourceStructureById, action.datasource.id);
    if (doesDatasourceStructureAlreadyExist) {
      return;
    }
    yield put(fetchDatasourceStructure(action.datasource.id, true));
  } else {
    return;
  }
}

export function* fetchActionsSaga(
  action: EvaluationReduxAction<FetchActionsPayload>,
) {
  const { applicationId } = action.payload;
  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.FETCH_ACTIONS_API,
    { mode: "EDITOR", appId: applicationId },
  );
  try {
    const response: ApiResponse<Action[]> =
      yield ActionAPI.fetchActions(applicationId);
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_ACTIONS_SUCCESS,
        payload: response.data,
        postEvalActions: action.postEvalActions,
      });
      PerformanceTracker.stopAsyncTracking(
        PerformanceTransactionName.FETCH_ACTIONS_API,
      );
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_ACTIONS_ERROR,
      payload: { error },
    });
    PerformanceTracker.stopAsyncTracking(
      PerformanceTransactionName.FETCH_ACTIONS_API,
      { failed: true },
    );
  }
}

export function* fetchActionsForViewModeSaga(
  action: ReduxAction<FetchActionsPayload>,
) {
  const { applicationId } = action.payload;
  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.FETCH_ACTIONS_API,
    { mode: "VIEWER", appId: applicationId },
  );
  try {
    const response: ApiResponse<ActionViewMode[]> =
      yield ActionAPI.fetchActionsForViewMode(applicationId);
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      const correctFormatResponse = response.data.map((action) => {
        return {
          ...action,
          actionConfiguration: {
            timeoutInMillisecond: action.timeoutInMillisecond,
          },
        };
      });
      yield put({
        type: ReduxActionTypes.FETCH_ACTIONS_VIEW_MODE_SUCCESS,
        payload: correctFormatResponse,
      });
    } else {
      yield put({
        type: ReduxActionErrorTypes.FETCH_ACTIONS_VIEW_MODE_ERROR,
        payload: response.responseMeta.error,
      });
    }
    PerformanceTracker.stopAsyncTracking(
      PerformanceTransactionName.FETCH_ACTIONS_API,
    );
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_ACTIONS_VIEW_MODE_ERROR,
      payload: { error },
    });
    PerformanceTracker.stopAsyncTracking(
      PerformanceTransactionName.FETCH_ACTIONS_API,
      { failed: true },
    );
  }
}

export function* fetchActionsForPageSaga(
  action: EvaluationReduxAction<{ pageId: string }>,
) {
  const { pageId } = action.payload;
  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.FETCH_PAGE_ACTIONS_API,
    { pageId: pageId },
  );
  try {
    const response: ApiResponse<Action[]> = yield call(
      ActionAPI.fetchActionsByPageId,
      pageId,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put(fetchActionsForPageSuccess(response.data));
      // wait for success of
      PerformanceTracker.stopAsyncTracking(
        PerformanceTransactionName.FETCH_PAGE_ACTIONS_API,
      );
    }
  } catch (error) {
    PerformanceTracker.stopAsyncTracking(
      PerformanceTransactionName.FETCH_PAGE_ACTIONS_API,
      { failed: true },
    );
    yield put({
      type: ReduxActionErrorTypes.FETCH_ACTIONS_FOR_PAGE_ERROR,
      payload: { error },
    });
  }
}

export function* updateActionSaga(actionPayload: ReduxAction<{ id: string }>) {
  try {
    PerformanceTracker.startAsyncTracking(
      PerformanceTransactionName.UPDATE_ACTION_API,
      { actionid: actionPayload.payload.id },
    );

    let action: Action = yield select(getAction, actionPayload.payload.id);
    if (!action) throw new Error("Could not find action to update");

    if (isAPIAction(action)) {
      // get api action object from redux form
      const reduxFormApiAction: ApiAction = yield select(
        getFormValues(API_EDITOR_FORM_NAME),
      );

      // run transformation on redux form action's headers, bodyformData and queryParameters.
      // the reason we do this is because the transformation should only be done on the raw action data from the redux form.
      // However sometimes when we attempt to save an API as a datasource, we update the Apiaction with the datasource information and the redux form data will not be available i.e. reduxFormApiAction = undefined
      // In this scenario we can just default to the action object - (skip the if block below).
      if (!isEmpty(reduxFormApiAction)) {
        action = {
          ...action,
          actionConfiguration: {
            ...action.actionConfiguration,
            headers: reduxFormApiAction.actionConfiguration.headers,
            bodyFormData: reduxFormApiAction.actionConfiguration.bodyFormData,
            queryParameters:
              reduxFormApiAction.actionConfiguration.queryParameters,
          },
        };
      }

      action = transformRestAction(action);
    }

    /* NOTE: This  is fix for a missing command config */
    const plugin: Plugin | undefined = yield select(getPlugin, action.pluginId);
    if (action && plugin && plugin.packageName === PluginPackageName.MONGO) {
      // @ts-expect-error: Types are not available
      action = fixActionPayloadForMongoQuery(action);
    }
    const response: ApiResponse<Action> = yield call(
      updateActionAPICall,
      action,
    );

    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      const pageName: string = yield select(
        getCurrentPageNameByActionId,
        response.data.id,
      );

      yield sendAnalyticsEventSaga(actionPayload.type, {
        action,
        pageName,
      });

      PerformanceTracker.stopAsyncTracking(
        PerformanceTransactionName.UPDATE_ACTION_API,
      );

      yield put(updateActionSuccess({ data: response.data }));
      checkAndLogErrorsIfCyclicDependency(
        (response.data as Action).errorReports,
      );
    }
  } catch (error) {
    PerformanceTracker.stopAsyncTracking(
      PerformanceTransactionName.UPDATE_ACTION_API,
      { failed: true },
    );
    yield put({
      type: ReduxActionErrorTypes.UPDATE_ACTION_ERROR,
      payload: { error, id: actionPayload.payload.id, show: false },
    });
  }
}

export function* deleteActionSaga(
  actionPayload: ReduxAction<{
    id: string;
    name: string;
    onSuccess?: () => void;
  }>,
) {
  try {
    const id = actionPayload.payload.id;
    const name = actionPayload.payload.name;
    const action: Action | undefined = yield select(getAction, id);

    if (!action) return;

    const isApi = action.pluginType === PluginType.API;
    const isQuery = action.pluginType === PluginType.DB;
    const isSaas = action.pluginType === PluginType.SAAS;
    const pageId: string = yield select(getCurrentPageId);

    const response: ApiResponse<Action> = yield ActionAPI.deleteAction(id);
    const isValidResponse: boolean = yield validateResponse(response);
    if (!isValidResponse) {
      return;
    }
    if (isApi) {
      const pageName: string = yield select(getCurrentPageNameByActionId, id);
      AnalyticsUtil.logEvent("DELETE_API", {
        apiName: name,
        pageName,
        apiID: id,
      });
    }
    if (isSaas) {
      const pageName: string = yield select(getCurrentPageNameByActionId, id);
      AnalyticsUtil.logEvent("DELETE_SAAS", {
        apiName: name,
        pageName,
        apiID: id,
      });
    }
    if (isQuery) {
      AnalyticsUtil.logEvent("DELETE_QUERY", {
        queryName: name,
      });
    }

    if (!!actionPayload.payload.onSuccess) {
      actionPayload.payload.onSuccess();
    } else {
      history.push(
        integrationEditorURL({
          pageId,
          selectedTab: INTEGRATION_TABS.NEW,
        }),
      );
    }

    AppsmithConsole.info({
      logType: LOG_TYPE.ENTITY_DELETED,
      text: "Action was deleted",
      source: {
        type: ENTITY_TYPE.ACTION,
        name: response.data.name,
        id: response.data.id,
      },
      analytics: {
        pluginId: action.pluginId,
      },
    });

    yield put(deleteActionSuccess({ id }));
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.DELETE_ACTION_ERROR,
      payload: { error, id: actionPayload.payload.id },
    });
  }
}

function* moveActionSaga(
  action: ReduxAction<{
    id: string;
    destinationPageId: string;
    originalPageId: string;
    name: string;
  }>,
) {
  const actionObject = shouldBeDefined<Action>(
    yield select(getAction, action.payload.id),
    `Action not found for id - ${action.payload.id}`,
  );
  try {
    const response: ApiResponse = yield ActionAPI.moveAction({
      action: {
        ...actionObject,
        pageId: action.payload.originalPageId,
        name: action.payload.name,
      },
      destinationPageId: action.payload.destinationPageId,
    });

    const isValidResponse: boolean = yield validateResponse(response);
    const pageName: string = yield select(
      getPageNameByPageId,
      // @ts-expect-error: response is of type unknown
      response.data.pageId,
    );
    if (isValidResponse) {
      toast.show(
        // @ts-expect-error: response is of type unknown
        createMessage(ACTION_MOVE_SUCCESS, response.data.name, pageName),
        {
          kind: "success",
        },
      );
    }

    AnalyticsUtil.logEvent("MOVE_API", {
      // @ts-expect-error: response is of type unknown
      apiName: response.data.name,
      pageName: pageName,
      // @ts-expect-error: response is of type unknown
      apiID: response.data.id,
    });
    // @ts-expect-error: response is of type unknown
    yield put(moveActionSuccess(response.data));
  } catch (e) {
    toast.show(createMessage(ERROR_ACTION_MOVE_FAIL, actionObject.name), {
      kind: "error",
    });
    yield put(
      moveActionError({
        id: action.payload.id,
        originalPageId: action.payload.originalPageId,
      }),
    );
  }
}

function* copyActionSaga(
  action: ReduxAction<{ id: string; destinationPageId: string; name: string }>,
) {
  let actionObject: Action = yield select(getAction, action.payload.id);
  try {
    if (!actionObject) throw new Error("Could not find action to copy");
    // At this point the actionObject.id will be the id of the action to be copied
    // We enhance the payload with eventData to track the action being copied
    actionObject = enhanceRequestPayloadWithEventData(
      actionObject,
      action.type,
    ) as Action;

    const copyAction = Object.assign({}, actionObject, {
      name: action.payload.name,
      pageId: action.payload.destinationPageId,
    }) as Partial<Action>;

    delete copyAction.id;
    const response: ApiResponse<ActionCreateUpdateResponse> =
      yield ActionAPI.createAction(copyAction);
    const datasources: Datasource[] = yield select(getDatasources);

    const isValidResponse: boolean = yield validateResponse(response);
    const pageName: string = yield select(
      getPageNameByPageId,
      // @ts-expect-error: pageId not present on ActionCreateUpdateResponse
      response.data.pageId,
    );
    if (isValidResponse) {
      toast.show(
        createMessage(ACTION_COPY_SUCCESS, actionObject.name, pageName),
        {
          kind: "success",
        },
      );

      // At this point the `actionObject.id` will not exist
      // So we need to get the originalActionId from the payload
      // if the eventData in the actionObject doesn't exist
      const originalActionId = get(
        actionObject,
        `${RequestPayloadAnalyticsPath}.originalActionId`,
        action.payload.id,
      );
      AnalyticsUtil.logEvent("DUPLICATE_ACTION", {
        // @ts-expect-error: name not present on ActionCreateUpdateResponse
        actionName: response.data.name,
        pageName: pageName,
        actionId: response.data.id,
        originalActionId,
        actionType: actionObject.pluginType,
      });
    }

    // checking if there is existing datasource to be added to the action payload
    const existingDatasource = datasources.find(
      (d: Datasource) => d.id === response.data.datasource.id,
    );

    let payload = response.data;

    if (existingDatasource) {
      payload = { ...payload, datasource: existingDatasource };
    }

    // @ts-expect-error: type mismatch Action vs ActionCreateUpdateResponse
    yield put(copyActionSuccess(payload));
  } catch (e) {
    const actionName = actionObject ? actionObject.name : "";
    toast.show(createMessage(ERROR_ACTION_COPY_FAIL, actionName), {
      kind: "error",
    });
    yield put(copyActionError(action.payload));
  }
}

export function* refactorActionName(
  id: string,
  pageId: string,
  oldName: string,
  newName: string,
) {
  // fetch page of the action
  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.REFACTOR_ACTION_NAME,
    { actionId: id },
  );

  const isServerDSLMigrationsEnabled = select(getIsServerDSLMigrationsEnabled);
  const params: FetchPageRequest = { id: pageId };
  if (isServerDSLMigrationsEnabled) {
    params.migrateDSL = true;
  }
  const pageResponse: FetchPageResponse = yield call(PageApi.fetchPage, params);
  // check if page request is successful
  const isPageRequestSuccessful: boolean = yield validateResponse(pageResponse);
  if (isPageRequestSuccessful) {
    // get the layoutId from the page response
    const layoutId = pageResponse.data.layouts[0].id;
    // call to refactor action
    const refactorResponse: ApiResponse = yield ActionAPI.updateActionName({
      layoutId,
      actionId: id,
      pageId: pageId,
      oldName: oldName,
      newName: newName,
    });

    const isRefactorSuccessful: boolean =
      yield validateResponse(refactorResponse);

    const currentPageId: string = yield select(getCurrentPageId);

    PerformanceTracker.stopAsyncTracking(
      PerformanceTransactionName.REFACTOR_ACTION_NAME,
      { isSuccess: isRefactorSuccessful },
    );
    if (isRefactorSuccessful) {
      yield put({
        type: ReduxActionTypes.SAVE_ACTION_NAME_SUCCESS,
        payload: {
          actionId: id,
        },
      });
      if (currentPageId === pageId) {
        // @ts-expect-error: refactorResponse is of type unknown
        yield updateCanvasWithDSL(refactorResponse.data, pageId, layoutId);
        yield put(
          updateActionData([
            {
              entityName: newName,
              dataPath: "data",
              data: undefined,
              dataPathRef: `${oldName}.data`,
            },
          ]),
        );
      } else {
        yield put(fetchActionsForPage(pageId));
      }
    }
  }
}

function* bindDataOnCanvasSaga(
  action: ReduxAction<{
    queryId: string;
    applicationId: string;
    pageId: string;
  }>,
) {
  const { pageId, queryId } = action.payload;
  yield put(setSnipingModeAction({ isActive: true, bindTo: queryId }));
  history.push(
    builderURL({
      pageId,
    }),
  );
}

function* saveActionName(action: ReduxAction<{ id: string; name: string }>) {
  // Takes from state, checks if the name isValid, saves
  const apiId = action.payload.id;
  const api = shouldBeDefined<ActionData>(
    yield select((state) =>
      state.entities.actions.find(
        (action: ActionData) => action.config.id === apiId,
      ),
    ),
    `Api not found for apiId - ${apiId}`,
  );

  try {
    yield refactorActionName(
      api.config.id,
      api.config.pageId || "",
      api.config.name,
      action.payload.name,
    );
  } catch (e) {
    yield put({
      type: ReduxActionErrorTypes.SAVE_ACTION_NAME_ERROR,
      payload: {
        actionId: action.payload.id,
        oldName: api.config.name,
      },
    });
    toast.show(createMessage(ERROR_ACTION_RENAME_FAIL, action.payload.name), {
      kind: "error",
    });
    log.error(e);
  }
}

export function* setActionPropertySaga(
  action: EvaluationReduxAction<SetActionPropertyPayload>,
) {
  const { actionId, propertyName, skipSave, value } = action.payload;
  if (!actionId) return;
  if (propertyName === "name") return;

  const actionObj: Action = yield select(getAction, actionId);
  const fieldToBeUpdated = propertyName.replace(
    "actionConfiguration",
    "config",
  );

  if (!actionObj) {
    return;
  }

  // we use the formData to crosscheck, just in case value is not updated yet.
  const formData: Action = yield select(
    getFormValues(
      actionObj?.pluginType === PluginType.API
        ? API_EDITOR_FORM_NAME
        : QUERY_EDITOR_FORM_NAME,
    ),
  );

  AppsmithConsole.info({
    logType: LOG_TYPE.ACTION_UPDATE,
    text: "Configuration updated",
    source: {
      type: ENTITY_TYPE.ACTION,
      name: actionObj?.name,
      id: actionId,
      propertyPath: fieldToBeUpdated,
    },
    state: {
      [fieldToBeUpdated]: value,
    },
  });

  const effects: Record<string, any> = {};
  // Value change effect
  effects[propertyName] = value;
  // Bindings change effect
  effects.dynamicBindingPathList = getDynamicBindingsChangesSaga(
    actionObj,
    value,
    propertyName,
    formData,
  );
  yield all(
    Object.keys(effects).map((field) =>
      put(
        updateActionProperty(
          { id: actionId, field, value: effects[field] },
          field === "dynamicBindingPathList" ? [] : action.postEvalActions,
        ),
      ),
    ),
  );
  if (propertyName === "executeOnLoad") {
    yield put({
      type: ReduxActionTypes.TOGGLE_ACTION_EXECUTE_ON_LOAD_INIT,
      payload: {
        actionId,
        shouldExecute: value,
      },
    });
    return;
  }
  //skipSave property is added to skip API calls when the updateAction needs to be called from the caller
  if (!skipSave) yield put(updateAction({ id: actionId }));
}

function* toggleActionExecuteOnLoadSaga(
  action: ReduxAction<{ actionId: string; shouldExecute: boolean }>,
) {
  try {
    const response: ApiResponse = yield call(
      ActionAPI.toggleActionExecuteOnLoad,
      action.payload.actionId,
      action.payload.shouldExecute,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.TOGGLE_ACTION_EXECUTE_ON_LOAD_SUCCESS,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.TOGGLE_ACTION_EXECUTE_ON_LOAD_ERROR,
      payload: error,
    });
  }
}

function* handleMoveOrCopySaga(actionPayload: ReduxAction<{ id: string }>) {
  const { id } = actionPayload.payload;
  const action: Action = yield select(getAction, id);
  const isApi = action.pluginType === PluginType.API;
  const isQuery = action.pluginType === PluginType.DB;
  const isSaas = action.pluginType === PluginType.SAAS;

  if (isApi) {
    history.push(
      apiEditorIdURL({
        pageId: action.pageId,
        apiId: action.id,
      }),
    );
  }
  if (isQuery) {
    history.push(
      queryEditorIdURL({
        pageId: action.pageId,
        queryId: action.id,
      }),
    );
  }
  if (isSaas) {
    const plugin = shouldBeDefined<Plugin>(
      yield select(getPlugin, action.pluginId),
      `Plugin not found for pluginId - ${action.pluginId}`,
    );
    history.push(
      saasEditorApiIdURL({
        pageId: action.pageId,
        pluginPackageName: plugin.packageName,
        apiId: action.id,
      }),
    );
  }
}

function* executeCommandSaga(actionPayload: ReduxAction<SlashCommandPayload>) {
  const pageId: string = yield select(getCurrentPageId);
  const callback = get(actionPayload, "payload.callback");
  switch (actionPayload.payload.actionType) {
    case SlashCommand.NEW_INTEGRATION:
      history.push(
        integrationEditorURL({
          pageId,
          selectedTab: INTEGRATION_TABS.NEW,
        }),
      );
      break;
    case SlashCommand.NEW_QUERY:
      const datasource = get(actionPayload, "payload.args.datasource");
      yield put(createNewQueryAction(pageId, "QUICK_COMMANDS", datasource.id));
      // @ts-expect-error: QUERY is of type unknown
      const QUERY = yield take(ReduxActionTypes.CREATE_ACTION_SUCCESS);
      if (callback) callback(`{{${QUERY.payload.name}.data}}`);
      break;
    case SlashCommand.NEW_API:
      yield put(createNewApiAction(pageId, "QUICK_COMMANDS"));
      // @ts-expect-error: QUERY is of type unknown
      const API = yield take(ReduxActionTypes.CREATE_ACTION_SUCCESS);
      if (callback) callback(`{{${API.payload.name}.data}}`);
      break;
    case SlashCommand.ASK_AI: {
      const context = get(actionPayload, "payload.args", {});
      const isJavascriptMode = context.mode === EditorModes.TEXT_WITH_BINDING;

      const noOfTimesAIPromptTriggered: number = yield select(
        (state) => state.ai.noOfTimesAITriggered,
      );

      const noOfTimesAIPromptTriggeredForQuery: number = yield select(
        (state) => state.ai.noOfTimesAITriggeredForQuery,
      );

      const triggerCount = isJavascriptMode
        ? noOfTimesAIPromptTriggered
        : noOfTimesAIPromptTriggeredForQuery;

      if (triggerCount < 5) {
        const currentValue: number = yield setAIPromptTriggered(context.mode);
        yield put({
          type: ReduxActionTypes.UPDATE_AI_TRIGGERED,
          payload: {
            value: currentValue,
            mode: context.mode,
          },
        });
      }

      yield put({
        type: ReduxActionTypes.UPDATE_AI_CONTEXT,
        payload: {
          context,
        },
      });
      break;
    }
  }
}

function* updateEntitySavingStatus() {
  yield race([
    take(ReduxActionTypes.UPDATE_ACTION_SUCCESS),
    take(ReduxActionTypes.SAVE_PAGE_SUCCESS),
    take(ReduxActionTypes.UPDATE_JS_ACTION_BODY_SUCCESS),
  ]);

  yield put({
    type: ReduxActionTypes.ENTITY_UPDATE_SUCCESS,
  });
}

export function* watchActionSagas() {
  yield all([
    takeEvery(ReduxActionTypes.SET_ACTION_PROPERTY, setActionPropertySaga),
    takeEvery(ReduxActionTypes.FETCH_ACTIONS_INIT, fetchActionsSaga),
    takeEvery(
      ReduxActionTypes.FETCH_ACTIONS_VIEW_MODE_INIT,
      fetchActionsForViewModeSaga,
    ),
    takeEvery(ReduxActionTypes.CREATE_ACTION_INIT, createActionSaga),
    takeLatest(ReduxActionTypes.UPDATE_ACTION_INIT, updateActionSaga),
    takeLatest(ReduxActionTypes.DELETE_ACTION_INIT, deleteActionSaga),
    takeLatest(ReduxActionTypes.BIND_DATA_ON_CANVAS, bindDataOnCanvasSaga),
    takeLatest(ReduxActionTypes.SAVE_ACTION_NAME_INIT, saveActionName),
    takeLatest(ReduxActionTypes.MOVE_ACTION_INIT, moveActionSaga),
    takeLatest(ReduxActionTypes.COPY_ACTION_INIT, copyActionSaga),
    takeLatest(
      ReduxActionTypes.FETCH_ACTIONS_FOR_PAGE_INIT,
      fetchActionsForPageSaga,
    ),
    takeEvery(ReduxActionTypes.MOVE_ACTION_SUCCESS, handleMoveOrCopySaga),
    takeEvery(ReduxActionTypes.COPY_ACTION_SUCCESS, handleMoveOrCopySaga),
    takeEvery(ReduxActionErrorTypes.MOVE_ACTION_ERROR, handleMoveOrCopySaga),
    takeEvery(ReduxActionErrorTypes.COPY_ACTION_ERROR, handleMoveOrCopySaga),
    takeLatest(
      ReduxActionTypes.TOGGLE_ACTION_EXECUTE_ON_LOAD_INIT,
      toggleActionExecuteOnLoadSaga,
    ),
    takeLatest(ReduxActionTypes.EXECUTE_COMMAND, executeCommandSaga),
    takeLatest(
      ReduxActionTypes.ENTITY_UPDATE_STARTED,
      updateEntitySavingStatus,
    ),
  ]);
}
