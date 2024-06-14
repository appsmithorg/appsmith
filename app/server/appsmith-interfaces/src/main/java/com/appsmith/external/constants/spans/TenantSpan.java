package com.appsmith.external.constants.spans;

import static com.appsmith.external.constants.spans.BaseSpan.APPSMITH_SPAN_PREFIX;

public class TenantSpan {
    public static final String FETCHING_DEFAULT_TENANT = APPSMITH_SPAN_PREFIX + "fetch_default_tenant";
    public static final String FETCH_TENANT_CACHE_POST_ERROR = APPSMITH_SPAN_PREFIX + "fetch_tenant_cache_error";
    public static final String FETCH_TENANT_FROM_DB = APPSMITH_SPAN_PREFIX + "fetch_tenant_by_id";
}
