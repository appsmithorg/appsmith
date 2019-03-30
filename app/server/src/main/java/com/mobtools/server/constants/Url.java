package com.mobtools.server.constants;

public interface Url {
    String BASE_URL = "/api";
    String VERSION = "/v1";
    String WIDGET_URL = BASE_URL + VERSION + "/widgets";
    String TENANT_URL = BASE_URL + VERSION + "/tenants";
    String LAYOUT_URL = BASE_URL + VERSION + "/layouts";
    String PLUGIN_URL = BASE_URL + VERSION + "/plugins";
    String QUERY_URL = BASE_URL + VERSION + "/queries";
}
