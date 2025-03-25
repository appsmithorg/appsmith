package com.appsmith.external.constants.spans.ce;

import static com.appsmith.external.constants.spans.BaseSpan.APPSMITH_SPAN_PREFIX;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.CONSOLIDATED_API_PREFIX;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.VIEW;

/**
 * Please make sure that all span names start with `appsmith.` because span with any other naming format would get
 * dropped / ignored as defined in TracingConfig.java
 */
public class ActionSpanCE {
    // Action execution spans
    public static final String ACTIONS = "actions.";
    public static final String ACTIONS_VIEW_MODE_PREFIX = CONSOLIDATED_API_PREFIX + VIEW + ACTIONS;
    public static final String ACTION_EXECUTION_REQUEST_PARSING = APPSMITH_SPAN_PREFIX + "request.parsing";
    public static final String ACTION_EXECUTION_CACHED_DATASOURCE = APPSMITH_SPAN_PREFIX + "get.datasource.cached";
    public static final String ACTION_EXECUTION_DATASOURCE_CONTEXT = APPSMITH_SPAN_PREFIX + "get.datasource.context";
    public static final String ACTION_EXECUTION_EDITOR_CONFIG = APPSMITH_SPAN_PREFIX + "get.editorConfig.cached";
    public static final String ACTION_EXECUTION_PLUGIN_EXECUTION = APPSMITH_SPAN_PREFIX + "total.plugin.execution";
    public static final String PLUGIN_EXECUTE_COMMON = APPSMITH_SPAN_PREFIX + "pluginExecuteCommon";
    public static final String MONGO_OUTPUT_MONO = APPSMITH_SPAN_PREFIX + "mongoOutputMono";

    public static final String CREATE_AND_EXECUTE_QUERY_FROM_CONNECTION =
            APPSMITH_SPAN_PREFIX + "createAndExecuteQueryFromConnection";

    public static final String ACTUAL_API_CALL = APPSMITH_SPAN_PREFIX + "actualApiCall";
    public static final String TRIGGER_API_CALL = APPSMITH_SPAN_PREFIX + "triggerApiCall";

    public static final String ACTION_EXECUTION_SERVER_EXECUTION = APPSMITH_SPAN_PREFIX + "total.server.execution";

    public static final String GET_ENVIRONMENT_ID = APPSMITH_SPAN_PREFIX + "getEnvironmentId";
    public static final String POPULATED_EXECUTE_ACTION_DTO_MONO =
            APPSMITH_SPAN_PREFIX + "populatedExecuteActionDTOMono";

    public static final String VALIDATE_AUTHENTICATION_DATASOURCE_STORAGE =
            APPSMITH_SPAN_PREFIX + "validateAuthenticationDatasourceStorage";
    public static final String VERIFY_DATASOURCE_AND_MAKE_REQUEST =
            APPSMITH_SPAN_PREFIX + "verifyDatasourceAndMakeRequest";
    public static final String SEND_EXECUTE_ANALYTICS_EVENT = APPSMITH_SPAN_PREFIX + "sendExecuteAnalyticsEvent";
    public static final String POPULATE_AND_EXECUTE_ACTION = APPSMITH_SPAN_PREFIX + "populateAndExecuteAction";
    public static final String GET_VALID_ACTION_FOR_EXECUTION = APPSMITH_SPAN_PREFIX + "getValidActionForExecution";
    public static final String GET_CACHED_PLUGIN_FOR_ACTION_EXECUTION =
            APPSMITH_SPAN_PREFIX + "getCachedPluginForActionExecution";
    public static final String GET_PLUGIN_EXECUTOR = APPSMITH_SPAN_PREFIX + "getPluginExecutor";
    public static final String GET_ACTION_EXECUTION_RESULT = APPSMITH_SPAN_PREFIX + "getActionExecutionResult";
    public static final String EXECUTE_ACTION = APPSMITH_SPAN_PREFIX + "executeAction";
    // Getter spans
    public static final String GET_UNPUBLISHED_ACTION = APPSMITH_SPAN_PREFIX + "get.action.unpublished";
    public static final String GET_VIEW_MODE_ACTION = APPSMITH_SPAN_PREFIX + "get.action.viewmode";
    public static final String GET_ACTION_REPOSITORY_CALL = APPSMITH_SPAN_PREFIX + "get.action.repository.call";
    public static final String VIEW_MODE_INITIAL_ACTION = ACTIONS_VIEW_MODE_PREFIX + "initial";
    public static final String VIEW_MODE_FINAL_ACTION = ACTIONS_VIEW_MODE_PREFIX + "final";
    public static final String VIEW_MODE_SET_PLUGIN_ID_AND_TYPE_JS = ACTIONS_VIEW_MODE_PREFIX + "set_js";
    public static final String VIEW_MODE_SET_PLUGIN_ID_AND_TYPE_ACTION = ACTIONS_VIEW_MODE_PREFIX + "set_action";
    public static final String VIEW_MODE_FETCH_PLUGIN_FROM_DB = ACTIONS_VIEW_MODE_PREFIX + "plugindb";
    public static final String VIEW_MODE_FETCH_ACTIONS_FROM_DB = ACTIONS_VIEW_MODE_PREFIX + "fetchactions";
    public static final String GET_ACTION_BY_ID = APPSMITH_SPAN_PREFIX + "get.actionById";

    // Action creation, update and delete spans
    public static final String UPDATE_SINGLE_ACTION = APPSMITH_SPAN_PREFIX + "update.single.action";
    public static final String UPDATE_ACTION_BASED_ON_CONTEXT = APPSMITH_SPAN_PREFIX + "update.action.context";
    public static final String CREATE_ACTION = APPSMITH_SPAN_PREFIX + "create.action";
    public static final String UPDATE_ACTION = APPSMITH_SPAN_PREFIX + "update.action";
    public static final String DELETE_ACTION = APPSMITH_SPAN_PREFIX + "delete.action";
    public static final String FILL_SELF_REFERENCING_PATHS_ACTION =
            APPSMITH_SPAN_PREFIX + "action.fillSelfReferencingPaths";

    public static final String VALIDATE_AND_GENERATE_ACTION_DOMAIN_BASED_ON_CONTEXT =
            APPSMITH_SPAN_PREFIX + ACTIONS + "validateAndGenerateActionDomainBasedOnContext";
    public static final String VALIDATE_AND_SAVE_ACTION_TO_REPOSITORY =
            APPSMITH_SPAN_PREFIX + ACTIONS + "validateAndSaveActionToRepository";
}
