package com.appsmith.server.applications.spans;

import static com.appsmith.external.constants.spans.BaseSpan.APPLICATION_SPAN_PREFIX;
import static com.appsmith.external.constants.spans.BaseSpan.APPSMITH_SPAN_PREFIX;

public class ApplicationSpansCE {

    public static final String FETCH_BY_DEFAULT_ID =
            APPSMITH_SPAN_PREFIX + APPLICATION_SPAN_PREFIX + "fetch_by_default_id";
    public static final String FETCH_BY_DEFAULT_ID_AND_BRANCH =
            APPSMITH_SPAN_PREFIX + APPLICATION_SPAN_PREFIX + "fetch_by_default_id_and_branch";
    public static final String FETCH_BY_ID = APPSMITH_SPAN_PREFIX + APPLICATION_SPAN_PREFIX + "fetch_by_id";
}
