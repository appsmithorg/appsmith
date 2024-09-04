package com.appsmith.external.constants.spans.ce;

import static com.appsmith.external.constants.spans.BaseSpan.APPSMITH_SPAN_PREFIX;

public class LayoutSpanCE {
    public static final String UPDATE_LAYOUT = "updateLayout.";
    public static final String UPDATE_PAGE_LAYOUT_BY_PAGE_ID = APPSMITH_SPAN_PREFIX + UPDATE_LAYOUT + "pageId";
    public static final String UPDATE_LAYOUT_METHOD = APPSMITH_SPAN_PREFIX + UPDATE_LAYOUT + "method";
    public static final String UPDATE_LAYOUT_DSL_METHOD = APPSMITH_SPAN_PREFIX + UPDATE_LAYOUT + "dsl.method";
    public static final String UPDATE_LAYOUT_BASED_ON_CONTEXT = APPSMITH_SPAN_PREFIX + UPDATE_LAYOUT + "context";

    public static final String FIND_ALL_ON_LOAD_EXECUTABLES =
            APPSMITH_SPAN_PREFIX + "onLoadExecutablesUtil.findAllOnLoadExecutables";
    public static final String UPDATE_EXECUTABLES_EXECUTE_ONLOAD =
            APPSMITH_SPAN_PREFIX + "onLoadExecutablesUtil.updateExecutablesExecuteOnLoad";
    public static final String FIND_AND_UPDATE_LAYOUT =
            APPSMITH_SPAN_PREFIX + "onLoadExecutablesUtil.findAndUpdateLayout";
}
