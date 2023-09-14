package com.appsmith.server.constants;

import com.appsmith.server.constants.ce.UrlCE;

public class Url extends UrlCE {

    static final String BASE_URL = "/api";
    static final String VERSION = "/v1";

    // EE specific endpoints.
    public static final String CHAT_URL = BASE_URL + VERSION + "/chat";
    public static final String AUDIT_LOGS_URL = BASE_URL + VERSION + "/audit-logs";
    public static final String PERMISSION_GROUP_URL = BASE_URL + VERSION + "/roles";
    public static final String USER_GROUP_URL = BASE_URL + VERSION + "/user-groups";
    // For sending special FE only events for Audit Logs
    public static final String ANALYTICS_URL = BASE_URL + VERSION + "/analytics";

    // Cloud Services URLs
    public static final String USAGE_REPORT_URL = BASE_URL + VERSION + "/usage/report";
    public static final String API_KEY_URL = BASE_URL + VERSION + "/api-key";

    // Provision Urls
    public static final String PROVISION_URL = BASE_URL + VERSION + "/provision";
    public static final String PROVISION_USER_URL = PROVISION_URL + "/users";
    public static final String PROVISION_GROUP_URL = PROVISION_URL + "/groups";
    public static final String KNOWLEDGE_BASE_URL = BASE_URL + VERSION + "/kb";
}
