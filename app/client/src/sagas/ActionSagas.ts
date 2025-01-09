import { toast } from "@appsmith/ads";
import { objectKeys } from "@appsmith/utils";
import { fetchDatasourceStructure } from "actions/datasourceActions";
import {
  setIdeEditorViewMode,
  setShowQueryCreateNewModal,
} from "actions/ideActions";
import {
  closeQueryActionTab,
  closeQueryActionTabSuccess,
  copyActionError,
  copyActionSuccess,
  createActionInit,
  createActionSuccess,
  createNewApiAction,
  createNewQueryAction,
  deleteActionSuccess,
  fetchActionsForPage,
  fetchActionsForPageSuccess,
  type FetchActionsPayload,
  moveActionError,
  moveActionSuccess,
  type SetActionPropertyPayload,
  updateAction,
  updateActionData,
  updateActionProperty,
  updateActionSuccess,
} from "actions/pluginActionActions";
import { setSnipingMode as setSnipingModeAction } from "actions/propertyPaneActions";
import type { ActionCreateUpdateResponse } from "api/ActionAPI";
import ActionAPI from "api/ActionAPI";
import type { ApiResponse } from "api/ApiResponses";
import type { FetchPageRequest, FetchPageResponse } from "api/PageApi";
import PageApi from "api/PageApi";
import type { Plugin } from "api/PluginApi";
import { EditorModes } from "components/editorComponents/CodeEditor/EditorConfig";
import {
  fixActionPayloadForMongoQuery,
  getConfigInitialValues,
} from "components/formControls/utils";
import { INTEGRATION_TABS } from "constants/routes";
import {
  API_EDITOR_FORM_NAME,
  QUERY_EDITOR_FORM_NAME,
} from "ee/constants/forms";
import {
  ACTION_COPY_SUCCESS,
  ACTION_MOVE_SUCCESS,
  createMessage,
  ERROR_ACTION_COPY_FAIL,
  ERROR_ACTION_MOVE_FAIL,
  ERROR_ACTION_RENAME_FAIL,
} from "ee/constants/messages";
import type { ReduxAction } from "actions/ReduxActionTypes";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import { CreateNewActionKey } from "ee/entities/Engine/actionHelpers";
import { EditorViewMode, IDE_TYPE } from "ee/entities/IDE/constants";
import { getIDETypeByUrl } from "ee/entities/IDE/utils";
import type { ActionData } from "ee/reducers/entityReducers/actionsReducer";
import {
  apiEditorIdURL,
  builderURL,
  integrationEditorURL,
  queryEditorIdURL,
  saasEditorApiIdURL,
} from "ee/RouteBuilder";
import { updateActionAPICall } from "ee/sagas/ApiCallerSagas";
import {
  generateDestinationIdInfoForQueryDuplication,
  resolveParentEntityMetadata,
} from "ee/sagas/helpers";
import { updateCanvasWithDSL } from "ee/sagas/PageSagas";
import {
  getAction,
  getCurrentPageNameByActionId,
  getDatasource,
  getDatasources,
  getDatasourceStructureById,
  getEditorConfig,
  getNewEntityName,
  getPageNameByPageId,
  getPlugin,
  getSettingConfig,
} from "ee/selectors/entitiesSelector";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type {
  Action,
  ActionViewMode,
  ApiAction,
  ApiActionConfig,
  BaseAction,
  CreateActionDefaultsParams,
  SlashCommandPayload,
} from "entities/Action";
import {
  ActionCreationSourceTypeEnum,
  isAPIAction,
  isGraphqlPlugin,
  PluginPackageName,
  PluginType,
  SlashCommand,
} from "entities/Action";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import type { Datasource, DatasourceStructure } from "entities/Datasource";
import { get, isEmpty, merge } from "lodash";
import { DEFAULT_API_ACTION_CONFIG } from "PluginActionEditor/constants/ApiEditorConstants";
import { DEFAULT_GRAPHQL_ACTION_CONFIG } from "PluginActionEditor/constants/GraphQLEditorConstants";
import { transformRestAction } from "PluginActionEditor/transformers/RestActionTransformer";
import { getFormValues } from "redux-form";
import {
  all,
  call,
  delay,
  fork,
  put,
  race,
  select,
  take,
  takeEvery,
  takeLatest,
} from "redux-saga/effects";
import {
  getCurrentBasePageId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { getIsSideBySideEnabled } from "selectors/ideSelectors";
import { convertToBaseParentEntityIdSelector } from "selectors/pageListSelectors";
import AppsmithConsole from "utils/AppsmithConsole";
import { getDynamicBindingsChangesSaga } from "utils/DynamicBindingUtils";
import { getDefaultTemplateActionConfig } from "utils/editorContextUtils";
import { shouldBeDefined } from "utils/helpers";
import history from "utils/history";
import { setAIPromptTriggered } from "utils/storage";
import { sendAnalyticsEventSaga } from "./AnalyticsSaga";
import { validateResponse } from "./ErrorSagas";
import FocusRetention from "./FocusRetentionSaga";
import {
  checkAndLogErrorsIfCyclicDependency,
  enhanceRequestPayloadWithEventData,
  getFromServerWhenNoPrefetchedResult,
  RequestPayloadAnalyticsPath,
} from "./helper";
import { handleQueryEntityRedirect } from "./IDESaga";
import type { EvaluationReduxAction } from "actions/EvaluationReduxActionTypes";

export const DEFAULT_PREFIX = {
  QUERY: "Query",
  API: "Api",
} as const;

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
  queryDefaultTableName,
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

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const defaultActionConfig: any = getDefaultTemplateActionConfig(
    plugin,
    queryDefaultTableName,
    dsStructure,
    datasource?.isMock,
  );

  // since table name has been consumed, we no longer need it, hence resetting it
  yield put({
    type: ReduxActionTypes.SET_DATASOURCE_PREVIEW_SELECTED_TABLE_NAME,
    payload: "",
  });

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

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorConfig: any[] = yield select(getEditorConfig, pluginId);

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

/**
 * This saga prepares the action request i.e it helps generating a
 * new name of an action. This is to reduce any dependency on name generation
 * on the caller of this saga.
 */
export function* createActionRequestSaga(
  actionPayload: ReduxAction<
    Partial<Action> & { eventData?: unknown; pluginId: string }
  >,
) {
  const payload = { ...actionPayload.payload };
  const pluginId =
    actionPayload.payload.pluginId ||
    actionPayload.payload.datasource?.pluginId;

  if (!actionPayload.payload.name) {
    const { parentEntityId, parentEntityKey } = resolveParentEntityMetadata(
      actionPayload.payload,
    );

    if (!parentEntityId || !parentEntityKey) return;

    const plugin: Plugin | undefined = yield select(getPlugin, pluginId || "");
    const isQueryType =
      plugin?.type === PluginType.DB ||
      plugin?.packageName === PluginPackageName.APPSMITH_AI;

    const prefix = isQueryType ? DEFAULT_PREFIX.QUERY : DEFAULT_PREFIX.API;

    if (
      plugin?.type === PluginType.DB ||
      plugin?.packageName === PluginPackageName.APPSMITH_AI
    ) {
      DEFAULT_PREFIX.QUERY;
    }

    payload.name = yield select(getNewEntityName, {
      prefix,
      parentEntityId,
      parentEntityKey,
    });
  }

  yield put(createActionInit(payload));
}

export function* createActionSaga(
  actionPayload: ReduxAction<
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Partial<Action> & { eventData: any; pluginId: string }
  >,
) {
  try {
    // Indicates that source of action creation is self
    actionPayload.payload.source = ActionCreationSourceTypeEnum.SELF;
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
          // since resources are recognized by their baseId in console
          id: response.data.baseId,
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

export function* fetchActionDatasourceStructure(
  action: ActionCreateUpdateResponse,
) {
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
  const { applicationId, unpublishedActions } = action.payload;

  try {
    const response: ApiResponse<Action[]> = yield call(
      getFromServerWhenNoPrefetchedResult,
      unpublishedActions,
      async () => ActionAPI.fetchActions({ applicationId }),
    );

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_ACTIONS_SUCCESS,
        payload: response.data,
        postEvalActions: action.postEvalActions,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_ACTIONS_ERROR,
      payload: { error },
    });
  }
}

export function* fetchActionsForViewModeSaga(
  action: ReduxAction<FetchActionsPayload>,
) {
  const { applicationId, publishedActions } = action.payload;

  try {
    const response: ApiResponse<ActionViewMode[]> = yield call(
      getFromServerWhenNoPrefetchedResult,
      publishedActions,
      async () => ActionAPI.fetchActionsForViewMode(applicationId),
    );

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
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_ACTIONS_VIEW_MODE_ERROR,
      payload: { error },
    });
  }
}

export function* fetchActionsForPageSaga(
  action: EvaluationReduxAction<{ pageId: string }>,
) {
  const { pageId } = action.payload;

  try {
    const response: ApiResponse<Action[]> = yield call(
      ActionAPI.fetchActionsByPageId,
      pageId,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put(fetchActionsForPageSuccess(response.data));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_ACTIONS_FOR_PAGE_ERROR,
      payload: { error },
    });
  }
}

export function* updateActionSaga(actionPayload: ReduxAction<{ id: string }>) {
  try {
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

      yield put(updateActionSuccess({ data: response.data }));
      checkAndLogErrorsIfCyclicDependency(
        (response.data as Action).errorReports,
      );
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_ACTION_ERROR,
      payload: { error, id: actionPayload.payload.id, show: false },
    });
  }
}

export function* apiCallToSaveAction(action: Action) {
  const response: ApiResponse<Action> = yield call(updateActionAPICall, action);

  const isValidResponse: boolean = yield validateResponse(response);

  if (isValidResponse) {
    yield put(updateActionSuccess({ data: response.data }));
    checkAndLogErrorsIfCyclicDependency((response.data as Action).errorReports);
  }

  return { isValidResponse, response };
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
    const currentUrl = window.location.pathname;
    const action: Action | undefined = yield select(getAction, id);
    const ideType = getIDETypeByUrl(currentUrl);

    if (!action) return;

    const isApi = action.pluginType === PluginType.API;
    const isQuery = action.pluginType === PluginType.DB;
    const isSaas = action.pluginType === PluginType.SAAS;
    const basePageId: string = yield select(getCurrentBasePageId);

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

    yield call(FocusRetention.handleRemoveFocusHistory, currentUrl);

    if (ideType === IDE_TYPE.App) {
      yield call(handleQueryEntityRedirect, action.id);
    } else {
      if (!!actionPayload.payload.onSuccess) {
        actionPayload.payload.onSuccess();
      } else {
        history.push(
          integrationEditorURL({
            basePageId,
            selectedTab: INTEGRATION_TABS.NEW,
          }),
        );
      }
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
    yield put(closeQueryActionTabSuccess({ id, parentId: basePageId }));
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
  const newName: string = yield select(getNewEntityName, {
    prefix: action.payload.name,
    parentEntityId: action.payload.destinationPageId,
    parentEntityKey: CreateNewActionKey.PAGE,
    startWithoutIndex: true,
  });

  try {
    const response: ApiResponse = yield ActionAPI.moveAction({
      action: {
        ...actionObject,
        pageId: action.payload.originalPageId,
        name: newName,
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
    yield call(
      closeActionTabSaga,
      closeQueryActionTab({
        id: action.payload.id,
        parentId: action.payload.originalPageId,
      }),
    );
    // @ts-expect-error: response is of type unknown
    yield put(moveActionSuccess(response.data));
  } catch (e) {
    yield put(
      moveActionError({
        id: action.payload.id,
        originalPageId: action.payload.originalPageId,
        show: true,
        error: {
          message: createMessage(ERROR_ACTION_MOVE_FAIL, actionObject.name),
        },
      }),
    );
  }
}

function* copyActionSaga(
  action: ReduxAction<{
    id: string;
    destinationEntityId: string;
    name: string;
  }>,
) {
  const { destinationEntityId, id, name } = action.payload;
  let actionObject: Action = yield select(getAction, id);

  const { parentEntityId, parentEntityKey } =
    resolveParentEntityMetadata(actionObject);

  if (!parentEntityId || !parentEntityKey) return;

  const newName: string = yield select(getNewEntityName, {
    prefix: name,
    parentEntityId: destinationEntityId,
    parentEntityKey,
    suffix: "Copy",
    startWithoutIndex: true,
  });

  const destinationEntityIdInfo = generateDestinationIdInfoForQueryDuplication(
    destinationEntityId,
    parentEntityKey,
  );

  if (objectKeys(destinationEntityIdInfo).length === 0) return;

  try {
    if (!actionObject) throw new Error("Could not find action to copy");

    // At this point the actionObject.id will be the id of the action to be copied
    // We enhance the payload with eventData to track the action being copied
    actionObject = enhanceRequestPayloadWithEventData(
      actionObject,
      action.type,
    ) as Action;

    const copyAction = Object.assign({}, actionObject, {
      name: newName,
      ...destinationEntityIdInfo,
    }) as Partial<Action>;

    // Indicates that source of action creation is copy action
    copyAction.source = ActionCreationSourceTypeEnum.COPY_ACTION;

    delete copyAction.id;
    delete copyAction.baseId;
    const response: ApiResponse<ActionCreateUpdateResponse> =
      yield ActionAPI.createAction(copyAction);
    const datasources: Datasource[] = yield select(getDatasources);

    const isValidResponse: boolean = yield validateResponse(response);
    let pageName: string = "";

    if (parentEntityKey === CreateNewActionKey.PAGE) {
      pageName = yield select(
        getPageNameByPageId,
        // @ts-expect-error: pageId not present on ActionCreateUpdateResponse
        response.data.pageId,
      );
    }

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
        id,
      );

      AnalyticsUtil.logEvent("DUPLICATE_ACTION", {
        // @ts-expect-error: name not present on ActionCreateUpdateResponse
        actionName: response.data.name,
        parentEntityId,
        parentEntityKey,
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
  } catch (e: unknown) {
    const actionName = actionObject ? actionObject.name : "";
    const errorMessage =
      e instanceof Error
        ? e.message
        : createMessage(ERROR_ACTION_COPY_FAIL, actionName);

    yield put(
      copyActionError({
        id,
        destinationEntityIdInfo,
        show: true,
        error: {
          message: errorMessage,
        },
      }),
    );
  }
}

export function* refactorActionName(
  id: string,
  pageId: string,
  oldName: string,
  newName: string,
) {
  const params: FetchPageRequest = { pageId, migrateDSL: true };
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
    basePageId: string;
  }>,
) {
  const { basePageId, queryId } = action.payload;

  yield put(setSnipingModeAction({ isActive: true, bindTo: queryId }));
  history.push(
    builderURL({
      basePageId,
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
        message: createMessage(ERROR_ACTION_RENAME_FAIL, action.payload.name),
      },
    });
  }
}

export function* setActionPropertySaga(
  action: EvaluationReduxAction<SetActionPropertyPayload>,
) {
  const { actionId, propertyName, skipSave, value } = action.payload;

  if (!actionId) return;

  if (propertyName === "name") return;

  const actionObj: Action = yield select(getAction, actionId);

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

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

function* handleMoveOrCopySaga(actionPayload: ReduxAction<Action>) {
  const { baseId: baseActionId, pluginId, pluginType } = actionPayload.payload;
  const isApi = pluginType === PluginType.API;
  const isQuery = pluginType === PluginType.DB;
  const isSaas = pluginType === PluginType.SAAS;
  const { parentEntityId } = resolveParentEntityMetadata(actionPayload.payload);

  if (!parentEntityId) return;

  const baseParentEntityId: string = yield select(
    convertToBaseParentEntityIdSelector,
    parentEntityId,
  );

  if (isApi) {
    history.push(
      apiEditorIdURL({
        baseParentEntityId,
        baseApiId: baseActionId,
      }),
    );
  }

  if (isQuery) {
    history.push(
      queryEditorIdURL({
        baseParentEntityId,
        baseQueryId: baseActionId,
      }),
    );
  }

  if (isSaas) {
    const plugin = shouldBeDefined<Plugin>(
      yield select(getPlugin, pluginId),
      `Plugin not found for pluginId - ${pluginId}`,
    );

    history.push(
      saasEditorApiIdURL({
        baseParentEntityId,
        pluginPackageName: plugin.packageName,
        baseApiId: baseActionId,
      }),
    );
  }
}

function* executeCommandSaga(actionPayload: ReduxAction<SlashCommandPayload>) {
  const pageId: string = yield select(getCurrentPageId);
  const basePageId: string = yield select(getCurrentBasePageId);
  const callback = get(actionPayload, "payload.callback");

  switch (actionPayload.payload.actionType) {
    case SlashCommand.NEW_INTEGRATION:
      history.push(
        integrationEditorURL({
          basePageId,
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
    take(ReduxActionTypes.EXECUTE_JS_UPDATES),
  ]);

  yield put({
    type: ReduxActionTypes.ENTITY_UPDATE_SUCCESS,
  });
}

function* handleCreateNewQueryFromActionCreator(
  action: ReduxAction<(name: string) => void>,
) {
  // Show the Query create modal from where the user selects the type of query to be created
  yield put(setShowQueryCreateNewModal(true));

  // Side by Side ramp. Switch to SplitScreen mode to allow user to edit query
  // created while having context of the canvas
  const isSideBySideEnabled: boolean = yield select(getIsSideBySideEnabled);

  if (isSideBySideEnabled) {
    yield put(setIdeEditorViewMode(EditorViewMode.SplitScreen));
  }

  // Wait for a query to be created
  const createdQuery: ReduxAction<BaseAction> = yield take(
    ReduxActionTypes.CREATE_ACTION_SUCCESS,
  );

  // A delay is needed to ensure the callback function has reference to the latest created Query
  yield delay(100);

  // Call the payload callback with the new query name that will set the binding to the field
  action.payload(createdQuery.payload.name);
}

export function* watchActionSagas() {
  yield all([
    takeEvery(ReduxActionTypes.SET_ACTION_PROPERTY, setActionPropertySaga),
    takeEvery(ReduxActionTypes.FETCH_ACTIONS_INIT, fetchActionsSaga),
    takeEvery(
      ReduxActionTypes.FETCH_ACTIONS_VIEW_MODE_INIT,
      fetchActionsForViewModeSaga,
    ),
    takeEvery(ReduxActionTypes.CREATE_ACTION_REQUEST, createActionRequestSaga),
    takeEvery(ReduxActionTypes.CREATE_ACTION_INIT, createActionSaga),
    takeLatest(ReduxActionTypes.UPDATE_ACTION_INIT, updateActionSaga),
    takeLatest(ReduxActionTypes.DELETE_ACTION_INIT, deleteActionSaga),
    takeLatest(ReduxActionTypes.CLOSE_QUERY_ACTION_TAB, closeActionTabSaga),
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
    takeLatest(
      ReduxActionTypes.CREATE_NEW_QUERY_FROM_ACTION_CREATOR,
      handleCreateNewQueryFromActionCreator,
    ),
  ]);
}

export function* closeActionTabSaga(
  actionPayload: ReduxAction<{
    id: string;
    parentId: string;
  }>,
) {
  const { id, parentId } = actionPayload.payload;
  const currentUrl = window.location.pathname;

  yield call(FocusRetention.handleRemoveFocusHistory, currentUrl);
  yield call(handleQueryEntityRedirect, id);
  yield put(closeQueryActionTabSuccess({ id, parentId }));
}
