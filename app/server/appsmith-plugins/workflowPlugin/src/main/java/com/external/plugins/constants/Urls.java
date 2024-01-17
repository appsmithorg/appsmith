package com.external.plugins.constants;

public class Urls {
    public static final String SERVER_URL = "http://localhost:8080";
    public static final String BASE_URL = "/api";
    public static final String VERSION = "/v1";
    public static final String WORKFLOW_URL = SERVER_URL + BASE_URL + VERSION + "/workflows";
    public static final String TRIGGER_WORKFLOW_URL = WORKFLOW_URL + "/trigger/";
    public static final String APPROVAL_REQUEST_URL = WORKFLOW_URL + "/approvalRequest";
    public static final String RESOLVE_APPROVAL_REQUEST_URL = APPROVAL_REQUEST_URL + "/resolve";
}
