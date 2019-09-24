package com.appsmith.server.constants;

public interface Url {
    String BASE_URL = "/api";
    String VERSION = "/v1";
    String WIDGET_URL = BASE_URL + VERSION + "/widgets";
    String ORGANIZATION_URL = BASE_URL + VERSION + "/organizations";
    String LAYOUT_URL = BASE_URL + VERSION + "/layouts";
    String PLUGIN_URL = BASE_URL + VERSION + "/plugins";
    String QUERY_URL = BASE_URL + VERSION + "/queries";
    String SETTING_URL = BASE_URL + VERSION + "/settings";
    String RESOURCE_URL = BASE_URL + VERSION + "/resources";
    String ACTION_URL = BASE_URL + VERSION + "/actions";
    String USER_URL = BASE_URL + VERSION + "/users";
    String APPLICATION_URL = BASE_URL + VERSION + "/applications";
    String PAGE_URL = BASE_URL + VERSION + "/pages";
    String PROPERTY_URL = BASE_URL + VERSION + "/properties";
}
