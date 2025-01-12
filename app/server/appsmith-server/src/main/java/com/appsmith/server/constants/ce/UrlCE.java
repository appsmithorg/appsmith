package com.appsmith.server.constants.ce;

import com.appsmith.server.constants.Entity;

public class UrlCE {
    static final String BASE_URL = "/api";
    static final String VERSION = "/v1";
    public static final String HEALTH_CHECK = BASE_URL + VERSION + "/health";
    public static final String LOGIN_URL = BASE_URL + VERSION + "/login";
    public static final String LOGOUT_URL = BASE_URL + VERSION + "/logout";
    public static final String WORKSPACE_URL = BASE_URL + VERSION + "/workspaces";
    public static final String LAYOUT_URL = BASE_URL + VERSION + "/layouts";
    public static final String PLUGIN_URL = BASE_URL + VERSION + "/plugins";
    public static final String DATASOURCE_URL = BASE_URL + VERSION + "/datasources";
    public static final String SAAS_URL = BASE_URL + VERSION + "/saas";
    public static final String ACTION_URL = BASE_URL + VERSION + "/actions";
    public static final String USER_URL = BASE_URL + VERSION + "/users";
    public static final String APPLICATION_URL = BASE_URL + VERSION + "/" + Entity.APPLICATIONS;
    public static final String PAGE_URL = BASE_URL + VERSION + "/" + Entity.PAGES;
    public static final String CONFIG_URL = BASE_URL + VERSION + "/configs";
    public static final String COLLECTION_URL = BASE_URL + VERSION + "/collections";
    public static final String ACTION_COLLECTION_URL = COLLECTION_URL + "/actions";
    public static final String IMPORT_URL = BASE_URL + VERSION + "/import";
    public static final String ASSET_URL = BASE_URL + VERSION + "/assets";
    public static final String INSTANCE_ADMIN_URL = BASE_URL + VERSION + "/admin";
    public static final String GIT_URL = BASE_URL + VERSION + "/git";
    public static final String THEME_URL = BASE_URL + VERSION + "/themes";
    public static final String APP_TEMPLATE_URL = BASE_URL + VERSION + "/app-templates";
    public static final String USAGE_PULSE_URL = BASE_URL + VERSION + "/usage-pulse";
    public static final String TENANT_URL = BASE_URL + VERSION + "/tenants";
    public static final String CUSTOM_JS_LIB_URL = BASE_URL + VERSION + "/libraries";
    public static final String PRODUCT_ALERT = BASE_URL + VERSION + "/product-alert";
    public static final String SEARCH_ENTITY_URL = BASE_URL + VERSION + "/search-entities";
    public static final String CONSOLIDATED_API_URL = BASE_URL + VERSION + "/consolidated-api";
    public static final String GIT_APPLICATION_URL = BASE_URL + VERSION + "/git/applications";
    public static final String GIT_ARTIFACT_URL = BASE_URL + VERSION + "/git/artifacts";

    // Sub-paths
    public static final String MOCKS = "/mocks";
    public static final String RELEASE_ITEMS = "/releaseItems";
}
