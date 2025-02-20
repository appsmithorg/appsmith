package com.appsmith.external.constants.spans.ce;

import static com.appsmith.external.constants.spans.BaseSpan.APPSMITH_SPAN_PREFIX;

public class OrganizationSpanCE {
    public static final String ORGANIZATION_SPAN = APPSMITH_SPAN_PREFIX + "tenant.";
    public static final String FETCH_DEFAULT_ORGANIZATION_SPAN = ORGANIZATION_SPAN + "fetch_default_tenant";
    public static final String FETCH_ORGANIZATION_CACHE_POST_DESERIALIZATION_ERROR_SPAN =
            ORGANIZATION_SPAN + "fetch_tenant_cache_post_deserialization_error";
    public static final String FETCH_ORGANIZATION_FROM_DB_SPAN = ORGANIZATION_SPAN + "fetch_tenant_from_db";
}
