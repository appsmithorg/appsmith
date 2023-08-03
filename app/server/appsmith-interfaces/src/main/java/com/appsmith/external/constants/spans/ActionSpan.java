package com.appsmith.external.constants.spans;

import static com.appsmith.external.constants.spans.BaseSpan.APPSMITH_SPAN_PREFIX;

public final class ActionSpan {

    // Action execution spans
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
}
