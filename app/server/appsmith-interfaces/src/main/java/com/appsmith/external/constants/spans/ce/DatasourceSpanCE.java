package com.appsmith.external.constants.spans.ce;

import static com.appsmith.external.constants.spans.BaseSpan.APPSMITH_SPAN_PREFIX;

public class DatasourceSpanCE {
    public static final String FETCH_ALL_DATASOURCES_WITH_STORAGES =
            APPSMITH_SPAN_PREFIX + "get_all_datasource_storage";
    public static final String FETCH_ALL_PLUGINS_IN_WORKSPACE = APPSMITH_SPAN_PREFIX + "get_all_plugins_in_workspace";
}
