package com.appsmith.external.constants.spans;

import static com.appsmith.external.constants.spans.BaseSpan.APPSMITH_;

public final class ActionSpan {

    // Action execution spans
    public static final String ACTION_EXECUTION_REQUEST_PARSING = APPSMITH_ + "request.parsing";
    public static final String ACTION_EXECUTION_CACHED_DATASOURCE = APPSMITH_ + "get.datasource.cached";
    public static final String ACTION_EXECUTION_DATASOURCE_CONTEXT = APPSMITH_ + "get.datasource.context";
    public static final String ACTION_EXECUTION_EDITOR_CONFIG = APPSMITH_ + "get.editorConfig.cached";
    public static final String ACTION_EXECUTION_PLUGIN_EXECUTION = APPSMITH_ + "total.plugin.execution";
    public static final String ACTION_EXECUTION_SERVER_EXECUTION = APPSMITH_ + "total.server.execution";

    // Getter spans
    public static final String GET_UNPUBLISHED_ACTION = APPSMITH_ + "get.action.unpublished";
    public static final String GET_VIEW_MODE_ACTION = APPSMITH_ + "get.action.viewmode";
    public static final String GET_ACTION_REPOSITORY_CALL = APPSMITH_ + "get.action.repository.call";


}
