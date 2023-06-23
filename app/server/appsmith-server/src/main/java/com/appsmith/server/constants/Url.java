package com.appsmith.server.constants;

import com.appsmith.server.constants.ce.UrlCE;

public class Url extends UrlCE {

    final static String BASE_URL = "/api";
    final static String VERSION = "/v1";

    // EE specific endpoints.
    final public static String CHAT_URL = BASE_URL + VERSION + "/chat";
    final public static String AUDIT_LOGS_URL = BASE_URL + VERSION + "/audit-logs";
    final public static String PERMISSION_GROUP_URL = BASE_URL + VERSION + "/roles";
    final public static String USER_GROUP_URL = BASE_URL + VERSION + "/user-groups";
    // For sending special FE only events for Audit Logs
    final public static String ANALYTICS_URL = BASE_URL + VERSION + "/analytics";

    // Cloud Services URLs
    final public static String USAGE_REPORT_URL = BASE_URL + VERSION + "/usage/report";
    final public static String API_KEY_URL = BASE_URL + VERSION + "/api-key";


}
