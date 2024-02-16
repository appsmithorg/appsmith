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
    public static final String LICENSE_URL = BASE_URL + VERSION + "/tenants/license";
    public static final String PACKAGE_URL = BASE_URL + VERSION + "/packages";
    public static final String MODULE_URL = BASE_URL + VERSION + "/modules";
    public static final String MODULE_INSTANCE_URL = BASE_URL + VERSION + "/moduleInstances";
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
    public static final String WORKFLOW_URL = BASE_URL + VERSION + "/workflows";
    public static final String WORKFLOW_TRIGGER_BASEPATH = "/trigger/";
    public static final String WORKFLOW_APPROVAL_URL = WORKFLOW_URL + "/approvalRequest";

    // Git URLs
    public static final String GIT_URL = BASE_URL + VERSION + "/git";
    public static final String GIT_DEPLOY_URL_BASEPATH = "/deploy/app/";
}
