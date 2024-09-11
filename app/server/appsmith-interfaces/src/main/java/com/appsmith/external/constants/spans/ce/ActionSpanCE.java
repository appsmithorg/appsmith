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
    public static final String ACTION_EXECUTION_SERVER_EXECUTION = APPSMITH_SPAN_PREFIX + "total.server.execution";

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
}
