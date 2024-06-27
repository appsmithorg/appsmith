package com.appsmith.external.constants.spans.ce;

import static com.appsmith.external.constants.spans.BaseSpan.APPSMITH_SPAN_PREFIX;

public class TenantSpanCE {
    public static final String TENANT_SPAN = APPSMITH_SPAN_PREFIX + "tenant.";
    public static final String FETCH_DEFAULT_TENANT_SPAN = TENANT_SPAN + "fetch_default_tenant";
    public static final String FETCH_TENANT_CACHE_POST_DESERIALIZATION_ERROR_SPAN =
            TENANT_SPAN + "fetch_tenant_cache_post_deserialization_error";
    public static final String FETCH_TENANT_FROM_DB_SPAN = TENANT_SPAN + "fetch_tenant_from_db";
}
