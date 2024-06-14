package com.appsmith.external.constants.spans;

import static com.appsmith.external.constants.spans.BaseSpan.APPSMITH_SPAN_PREFIX;

public class TenantSpan {
    public static final String FETCH_DEFAULT_TENANT_SPAN = APPSMITH_SPAN_PREFIX + "fetch_default_tenant";
    public static final String FETCH_TENANT_CACHE_POST_DESERIALIZATION_ERROR_SPAN =
            APPSMITH_SPAN_PREFIX + "fetch_tenant_cache_post_deserialization_error";
    public static final String FETCH_TENANT_FROM_DB_SPAN = APPSMITH_SPAN_PREFIX + "fetch_tenant_from_db";
}
