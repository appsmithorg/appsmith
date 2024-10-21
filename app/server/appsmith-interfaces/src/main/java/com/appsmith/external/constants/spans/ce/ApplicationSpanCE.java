package com.appsmith.external.constants.spans.ce;

import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.APPLICATION_ID_SPAN;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.CONSOLIDATED_API_PREFIX;

public class ApplicationSpanCE {
    public static final String APPLICATION_FETCH_FROM_DB = CONSOLIDATED_API_PREFIX + "app_db";
    public static final String APPLICATION_ID_FETCH_REDIS_SPAN = APPLICATION_ID_SPAN + ".read_redis";
    public static final String APPLICATION_ID_UPDATE_REDIS_SPAN = APPLICATION_ID_SPAN + ".update_redis";
    public static final String APPLICATION_SAVE_LAST_EDIT_INFO_SPAN = APPLICATION_ID_SPAN + ".save_last_edit_info";
}
