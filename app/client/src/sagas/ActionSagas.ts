import {
  EvaluationReduxAction,
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import {
  all,
  call,
  put,
  race,
  select,
  take,
  takeEvery,
  takeLatest,
} from "redux-saga/effects";
import { Datasource } from "entities/Datasource";
import ActionAPI, { ActionCreateUpdateResponse } from "api/ActionAPI";
import { GenericApiResponse } from "api/ApiResponses";
import PageApi from "api/PageApi";
import { updateCanvasWithDSL } from "sagas/PageSagas";
import {
  copyActionError,
  copyActionSuccess,
  createActionRequest,
  createActionSuccess,
  deleteActionSuccess,
  fetchActionsForPage,
  fetchActionsForPageSuccess,
  FetchActionsPayload,
  moveActionError,
  moveActionSuccess,
  SetActionPropertyPayload,
  updateAction,
  updateActionProperty,
  updateActionSuccess,
} from "actions/pluginActionActions";
import { getDynamicBindingsChangesSaga } from "utils/DynamicBindingUtils";
import { validateResponse } from "./ErrorSagas";
import { transformRestAction } from "transformers/RestActionTransformer";
import {
  getActionById,
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  Action,
  ActionViewMode,
  isAPIAction,
  PluginType,
  SlashCommand,
  SlashCommandPayload,
} from "entities/Action";
import {
  ActionData,
  ActionDataState,
} from "reducers/entityReducers/actionsReducer";
import {
  getAction,
  getCurrentPageNameByActionId,
  getEditorConfig,
  getPageNameByPageId,
  getPlugin,
  getSettingConfig,
  getDatasources,
  getActions,
} from "selectors/entitiesSelector";
import history from "utils/history";
import {
  API_EDITOR_ID_URL,
  BUILDER_PAGE_URL,
  INTEGRATION_EDITOR_URL,
  INTEGRATION_TABS,
  QUERIES_EDITOR_ID_URL,
} from "constants/routes";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
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
import { merge, get } from "lodash";
import { getConfigInitialValues } from "components/formControls/utils";
import AppsmithConsole from "utils/AppsmithConsole";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import { SAAS_EDITOR_API_ID_URL } from "pages/Editor/SaaSEditor/constants";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { createNewApiAction } from "actions/apiPaneActions";
import {
  createNewApiName,
  createNewQueryName,
  getQueryParams,
} from "utils/AppsmithUtils";
import { DEFAULT_API_ACTION_CONFIG } from "constants/ApiEditorConstants";
import {
  toggleShowGlobalSearchModal,
  setGlobalSearchFilterContext,
} from "actions/globalSearchActions";
import {
  filterCategories,
  SEARCH_CATEGORY_ID,
} from "components/editorComponents/GlobalSearch/utils";
import { getSelectedWidget, getWidgetByID } from "./selectors";
import {
  onApiEditor,
  onQueryEditor,
} from "components/editorComponents/Debugger/helpers";
import { Plugin } from "api/PluginApi";
import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { SnippetAction } from "reducers/uiReducers/globalSearchReducer";
import * as log from "loglevel";

export function* createActionSaga(
  actionPayload: ReduxAction<
    Partial<Action> & { eventData: any; pluginId: string }
  >,
) {
  try {
    let payload = actionPayload.payload;
    if (actionPayload.payload.pluginId) {
      const editorConfig = yield select(
        getEditorConfig,
        actionPayload.payload.pluginId,
      );

      const settingConfig = yield select(
        getSettingConfig,
        actionPayload.payload.pluginId,
      );

      let initialValues = yield call(getConfigInitialValues, editorConfig);
      if (settingConfig) {
        const settingInitialValues = yield call(
          getConfigInitialValues,
          settingConfig,
        );
        initialValues = merge(initialValues, settingInitialValues);
      }
      payload = merge(initialValues, actionPayload.payload);
    }

    const response: ActionCreateUpdateResponse = yield ActionAPI.createAction(
      payload,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      const pageName = yield select(
        getCurrentPageNameByActionId,
        response.data.id,
      );

      AnalyticsUtil.logEvent("CREATE_ACTION", {
        id: response.data.id,
        actionName: response.data.name,
        pageName: pageName,
        ...actionPayload.payload.eventData,
      });

      AppsmithConsole.info({
        text: `Action created`,
        source: {
          type: ENTITY_TYPE.ACTION,
          id: response.data.id,
          name: response.data.name,
        },
      });

      const newAction = response.data;
      yield put(createActionSuccess(newAction));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_ACTION_ERROR,
      payload: actionPayload.payload,
    });
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
    const response: GenericApiResponse<Action[]> = yield ActionAPI.fetchActions(
      applicationId,
    );
    const isValidResponse = yield validateResponse(response);
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
    const response: GenericApiResponse<ActionViewMode[]> = yield ActionAPI.fetchActionsForViewMode(
      applicationId,
    );
    const correctFormatResponse = response.data.map((action) => {
      return {
        ...action,
        actionConfiguration: {
          timeoutInMillisecond: action.timeoutInMillisecond,
        },
      };
    });
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_ACTIONS_VIEW_MODE_SUCCESS,
        payload: correctFormatResponse,
      });
      PerformanceTracker.stopAsyncTracking(
        PerformanceTransactionName.FETCH_ACTIONS_API,
      );
    }
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
    const response: GenericApiResponse<Action[]> = yield call(
      ActionAPI.fetchActionsByPageId,
      pageId,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put(
        fetchActionsForPageSuccess(response.data, action.postEvalActions),
      );
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

export function* updateActionSaga(
  actionPayload: ReduxAction<{ id: string; action?: Action }>,
) {
  try {
    PerformanceTracker.startAsyncTracking(
      PerformanceTransactionName.UPDATE_ACTION_API,
      { actionid: actionPayload.payload.id },
    );
    let action = actionPayload.payload.action;
    if (!action) action = yield select(getAction, actionPayload.payload.id);
    if (!action) throw new Error("Could not find action to update");

    if (isAPIAction(action)) {
      action = transformRestAction(action);
    }

    const response: GenericApiResponse<Action> = yield ActionAPI.updateAction(
      action,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      const pageName: string = yield select(
        getCurrentPageNameByActionId,
        response.data.id,
      );

      if (action.pluginType === PluginType.DB) {
        AnalyticsUtil.logEvent("SAVE_QUERY", {
          queryName: action.name,
          pageName,
        });
      } else if (action.pluginType === PluginType.API) {
        AnalyticsUtil.logEvent("SAVE_API", {
          apiId: response.data.id,
          apiName: response.data.name,
          pageName: pageName,
        });
      } else if (action.pluginType === PluginType.SAAS) {
        AnalyticsUtil.logEvent("SAVE_SAAS", {
          apiId: response.data.id,
          apiName: response.data.name,
          pageName: pageName,
        });
      }

      PerformanceTracker.stopAsyncTracking(
        PerformanceTransactionName.UPDATE_ACTION_API,
      );

      yield put(updateActionSuccess({ data: response.data }));
    }
  } catch (error) {
    PerformanceTracker.stopAsyncTracking(
      PerformanceTransactionName.UPDATE_ACTION_API,
      { failed: true },
    );
    yield put({
      type: ReduxActionErrorTypes.UPDATE_ACTION_ERROR,
      payload: { error, id: actionPayload.payload.id },
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

    const response: GenericApiResponse<Action> = yield ActionAPI.deleteAction(
      id,
    );
    const isValidResponse = yield validateResponse(response);
    if (!isValidResponse) {
      return;
    }
    if (isApi) {
      const pageName = yield select(getCurrentPageNameByActionId, id);
      AnalyticsUtil.logEvent("DELETE_API", {
        apiName: name,
        pageName,
        apiID: id,
      });
    }
    if (isSaas) {
      const pageName = yield select(getCurrentPageNameByActionId, id);
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
      const pageId = yield select(getCurrentPageId);
      const applicationId = yield select(getCurrentApplicationId);

      history.push(
        INTEGRATION_EDITOR_URL(applicationId, pageId, INTEGRATION_TABS.NEW),
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
  const actionObject: Action = yield select(getAction, action.payload.id);
  try {
    const response = yield ActionAPI.moveAction({
      action: {
        ...actionObject,
        pageId: action.payload.originalPageId,
        name: action.payload.name,
      },
      destinationPageId: action.payload.destinationPageId,
    });

    const isValidResponse = yield validateResponse(response);
    const pageName = yield select(getPageNameByPageId, response.data.pageId);
    if (isValidResponse) {
      Toaster.show({
        text: createMessage(ACTION_MOVE_SUCCESS, response.data.name, pageName),
        variant: Variant.success,
      });
    }

    AnalyticsUtil.logEvent("MOVE_API", {
      apiName: response.data.name,
      pageName: pageName,
      apiID: response.data.id,
    });
    yield put(moveActionSuccess(response.data));
  } catch (e) {
    Toaster.show({
      text: createMessage(ERROR_ACTION_MOVE_FAIL, actionObject.name),
      variant: Variant.danger,
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
  const actionObject: Action = yield select(getAction, action.payload.id);
  try {
    if (!actionObject) throw new Error("Could not find action to copy");

    const copyAction = Object.assign({}, actionObject, {
      name: action.payload.name,
      pageId: action.payload.destinationPageId,
    }) as Partial<Action>;
    delete copyAction.id;
    const response = yield ActionAPI.createAction(copyAction);
    const datasources = yield select(getDatasources);

    const isValidResponse = yield validateResponse(response);
    const pageName = yield select(getPageNameByPageId, response.data.pageId);
    if (isValidResponse) {
      Toaster.show({
        text: createMessage(ACTION_COPY_SUCCESS, actionObject.name, pageName),
        variant: Variant.success,
      });
    }

    AnalyticsUtil.logEvent("DUPLICATE_API", {
      apiName: response.data.name,
      pageName: pageName,
      apiID: response.data.id,
    });

    // checking if there is existing datasource to be added to the action payload
    const existingDatasource = datasources.find(
      (d: Datasource) => d.id === response.data.datasource.id,
    );

    let payload = response.data;

    if (existingDatasource) {
      payload = { ...payload, datasource: existingDatasource };
    }

    yield put(copyActionSuccess(payload));
  } catch (e) {
    const actionName = actionObject ? actionObject.name : "";
    Toaster.show({
      text: createMessage(ERROR_ACTION_COPY_FAIL, actionName),
      variant: Variant.danger,
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
  const pageResponse = yield call(PageApi.fetchPage, {
    id: pageId,
  });
  // check if page request is successful
  const isPageRequestSuccessful = yield validateResponse(pageResponse);
  if (isPageRequestSuccessful) {
    // get the layoutId from the page response
    const layoutId = pageResponse.data.layouts[0].id;
    // call to refactor action
    const refactorResponse = yield ActionAPI.updateActionName({
      layoutId,
      actionId: id,
      pageId: pageId,
      oldName: oldName,
      newName: newName,
    });

    const isRefactorSuccessful = yield validateResponse(refactorResponse);

    const currentPageId = yield select(getCurrentPageId);

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
        yield updateCanvasWithDSL(refactorResponse.data, pageId, layoutId);
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
  const applicationId = yield select(getCurrentApplicationId);
  history.push(
    BUILDER_PAGE_URL({
      applicationId,
      pageId,
      params: {
        isSnipingMode: "true",
        bindTo: queryId,
      },
    }),
  );
}

function* saveActionName(action: ReduxAction<{ id: string; name: string }>) {
  // Takes from state, checks if the name isValid, saves
  const apiId = action.payload.id;
  const api = yield select((state) =>
    state.entities.actions.find(
      (action: ActionData) => action.config.id === apiId,
    ),
  );
  try {
    yield refactorActionName(
      api.config.id,
      api.config.pageId,
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
    Toaster.show({
      text: createMessage(ERROR_ACTION_RENAME_FAIL, action.payload.name),
      variant: Variant.danger,
    });
    log.error(e);
  }
}

export function* setActionPropertySaga(
  action: ReduxAction<SetActionPropertyPayload>,
) {
  const { actionId, propertyName, skipSave, value } = action.payload;
  if (!actionId) return;
  if (propertyName === "name") return;

  const actionObj: Action = yield select(getAction, actionId);
  const fieldToBeUpdated = propertyName.replace(
    "actionConfiguration",
    "config",
  );
  AppsmithConsole.info({
    logType: LOG_TYPE.ACTION_UPDATE,
    text: "Configuration updated",
    source: {
      type: ENTITY_TYPE.ACTION,
      name: actionObj.name,
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
  );
  yield all(
    Object.keys(effects).map((field) =>
      put(updateActionProperty({ id: actionId, field, value: effects[field] })),
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
    const response = yield call(
      ActionAPI.toggleActionExecuteOnLoad,
      action.payload.actionId,
      action.payload.shouldExecute,
    );
    const isValidResponse = yield validateResponse(response);
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
  const applicationId = yield select(getCurrentApplicationId);

  if (isApi) {
    history.push(API_EDITOR_ID_URL(applicationId, action.pageId, action.id));
  }
  if (isQuery) {
    history.push(
      QUERIES_EDITOR_ID_URL(applicationId, action.pageId, action.id),
    );
  }
  if (isSaas) {
    const plugin = yield select(getPlugin, action.pluginId);
    history.push(
      SAAS_EDITOR_API_ID_URL(
        applicationId,
        action.pageId,
        plugin.packageName,
        action.id,
      ),
    );
  }
}

function* buildMetaForSnippets(
  entityId: any,
  entityType: string,
  expectedType: string,
  propertyPath: string,
) {
  /*
    Score is set to sort the snippets in the following order.
      1. Field (10)
      2. Entity + (All Queries / All Widgets) +Data Type (9)
      3. Entity + Data Type (8)
      4. Entity (5)
      5. All Queries / All Widgets + Data Type (4)
      6. All Queries / All Widgets 1
  */
  /*
  UNKNOWN is given priority over other non matching dataTypes.
  Eg. If there are no snippets matching a dataType criteria, we are promote snippets of type UNKNOWN
 */
  const refinements: any = {
    entities: [entityType],
  };
  const fieldMeta: {
    dataType: Array<string>;
    fields?: Array<string>;
    entities?: Array<string>;
  } = {
    dataType: [`${expectedType}<score=3>`, `UNKNOWN<score=1>`],
  };
  if (propertyPath) {
    const relevantField = propertyPath
      .split(".")
      .slice(-1)
      .pop();
    fieldMeta.fields = [`${relevantField}<score=10>`];
  }
  if (entityType === ENTITY_TYPE.ACTION && entityId) {
    const currentEntity: Action = yield select(getActionById, {
      match: { params: { apiId: entityId } },
    });
    const plugin: Plugin = yield select(getPlugin, currentEntity.pluginId);
    const type: string = plugin.packageName || "";
    refinements.entities = [type, entityType];
    fieldMeta.entities = [`${type}<score=5>`, `${entityType}<score=1>`];
  }
  if (entityType === ENTITY_TYPE.WIDGET && entityId) {
    const currentEntity: FlattenedWidgetProps = yield select(
      getWidgetByID(entityId),
    );
    const type: string = currentEntity.type || "";
    refinements.entities = [type, entityType];
    fieldMeta.entities = [`${type}<score=5>`, `${entityType}<score=1>`];
  }
  return { refinements, fieldMeta };
}

export function* getCurrentEntity(
  pageId: string,
  params: Record<string, string>,
) {
  let entityId = "",
    entityType = "";
  if (onApiEditor() || onQueryEditor()) {
    const id = params.apiId || params.queryId;
    const action: Action = yield select(getAction, id);
    entityId = action?.id;
    entityType = ENTITY_TYPE.ACTION;
  } else {
    const widget: FlattenedWidgetProps = yield select(getSelectedWidget);
    entityId = widget?.widgetId;
    entityType = ENTITY_TYPE.WIDGET;
  }
  return { entityId, entityType };
}

function* executeCommandSaga(actionPayload: ReduxAction<SlashCommandPayload>) {
  const pageId: string = yield select(getCurrentPageId);
  const applicationId = yield select(getCurrentApplicationId);
  const callback = get(actionPayload, "payload.callback");
  const params = getQueryParams();
  switch (actionPayload.payload.actionType) {
    case SlashCommand.NEW_SNIPPET:
      let { entityId, entityType } = get(actionPayload, "payload.args", {});
      const { expectedType, propertyPath } = get(
        actionPayload,
        "payload.args",
        {},
      );
      // Entity is derived using the dataTreePath property.
      // Fallback to find current entity when dataTreePath property value is empty (Eg. trigger fields)
      if (!entityId) {
        const currentEntity: {
          entityId: string;
          entityType: string;
        } = yield getCurrentEntity(pageId, params);
        entityId = currentEntity.entityId;
        entityType = currentEntity.entityType;
      }

      const { fieldMeta, refinements } = yield buildMetaForSnippets(
        entityId,
        entityType,
        expectedType,
        propertyPath,
      );
      yield put(
        setGlobalSearchFilterContext({
          refinements,
          fieldMeta,
        }),
      );

      yield put(
        toggleShowGlobalSearchModal(
          filterCategories[SEARCH_CATEGORY_ID.SNIPPETS],
        ),
      );
      yield put(
        setGlobalSearchFilterContext({
          onEnter:
            typeof callback === "function"
              ? SnippetAction.INSERT
              : SnippetAction.COPY, //Set insertSnippet to true only if values
          hideOuterBindings: entityType === ENTITY_TYPE.JSACTION,
        }),
      );
      AnalyticsUtil.logEvent("SNIPPET_LOOKUP", {
        source:
          typeof callback === "function" ? "SLASH_COMMAND" : "SNIPPET_BUTTON",
      });
      const effectRaceResult: { failure: any; success: any } = yield race({
        failure: take(ReduxActionTypes.CANCEL_SNIPPET),
        success: take(ReduxActionTypes.INSERT_SNIPPET),
      });
      if (effectRaceResult.failure) return;
      if (callback) callback(effectRaceResult.success.payload);
      break;
    case SlashCommand.NEW_INTEGRATION:
      history.push(
        INTEGRATION_EDITOR_URL(applicationId, pageId, INTEGRATION_TABS.NEW),
      );
      break;
    case SlashCommand.NEW_QUERY:
      const datasource = get(actionPayload, "payload.args.datasource");
      const pluginId = get(datasource, "pluginId");
      const plugin: Plugin = yield select(getPlugin, pluginId);
      const actions: ActionDataState = yield select(getActions);
      const pageActions = actions.filter(
        (a: ActionData) => a.config.pageId === pageId,
      );
      const newQueryName =
        plugin.type === PluginType.DB
          ? createNewQueryName(actions, pageId)
          : createNewApiName(pageActions, pageId);
      const nextPayload: Partial<Action> = {
        name: newQueryName,
        pageId,
        eventData: {
          actionType: "Query",
          from: "Quick-Commands",
          dataSource: datasource.name,
        },
        pluginId: datasource.pluginId,
        actionConfiguration: {},
      };
      if (plugin.type === "API") {
        nextPayload.datasource = datasource;
        nextPayload.actionConfiguration = DEFAULT_API_ACTION_CONFIG;
      } else {
        nextPayload.datasource = {
          id: datasource.id,
        };
      }
      yield put(createActionRequest(nextPayload));
      const QUERY = yield take(ReduxActionTypes.CREATE_ACTION_SUCCESS);
      if (callback) callback(`{{${QUERY.payload.name}.data}}`);
      break;
    case SlashCommand.NEW_API:
      yield put(createNewApiAction(pageId, "QUICK_COMMANDS"));
      const API = yield take(ReduxActionTypes.CREATE_ACTION_SUCCESS);
      if (callback) callback(`{{${API.payload.name}.data}}`);
      break;
  }
}

function* updateEntitySavingStatus() {
  yield race([
    take(ReduxActionTypes.UPDATE_ACTION_SUCCESS),
    take(ReduxActionTypes.SAVE_PAGE_SUCCESS),
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
