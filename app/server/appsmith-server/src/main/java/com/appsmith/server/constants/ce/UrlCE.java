package com.appsmith.server.constants.ce;

import com.appsmith.server.constants.Entity;

public class UrlCE {
    final static String BASE_URL = "/api";
    final static String VERSION = "/v1";
    final public static String HEALTH_CHECK = BASE_URL + VERSION + "/health";
    final public static String LOGIN_URL = BASE_URL + VERSION + "/login";
    final public static String LOGOUT_URL = BASE_URL + VERSION + "/logout";
    final public static String WORKSPACE_URL = BASE_URL + VERSION + "/workspaces";
    final public static String LAYOUT_URL = BASE_URL + VERSION + "/layouts";
    final public static String PLUGIN_URL = BASE_URL + VERSION + "/plugins";
    final public static String DATASOURCE_URL = BASE_URL + VERSION + "/datasources";
    final public static String SAAS_URL = BASE_URL + VERSION + "/saas";
    final public static String ACTION_URL = BASE_URL + VERSION + "/actions";
    final public static String USER_URL = BASE_URL + VERSION + "/users";
    final public static String APPLICATION_URL = BASE_URL + VERSION + "/" + Entity.APPLICATIONS;
    final public static String PAGE_URL = BASE_URL + VERSION + "/" + Entity.PAGES;
    final public static String CONFIG_URL = BASE_URL + VERSION + "/configs";
    final public static String GROUP_URL = BASE_URL + VERSION + "/groups";
    final public static String COLLECTION_URL = BASE_URL + VERSION + "/collections";
    final public static String ACTION_COLLECTION_URL = COLLECTION_URL + "/actions";
    final public static String IMPORT_URL = BASE_URL + VERSION + "/import";
    final public static String PROVIDER_URL = BASE_URL + VERSION + "/providers";
    final public static String MARKETPLACE_URL = BASE_URL + VERSION + "/marketplace";
    final public static String API_TEMPLATE_URL = BASE_URL + VERSION + "/templates";
    final public static String MARKETPLACE_ITEM_URL = BASE_URL + VERSION + "/items";
    final public static String ASSET_URL = BASE_URL + VERSION + "/assets";
    final public static String COMMENT_URL = BASE_URL + VERSION + "/comments";
    final public static String NOTIFICATION_URL = BASE_URL + VERSION + "/notifications";
    final public static String INSTANCE_ADMIN_URL = BASE_URL + VERSION + "/admin";
    final public static String GIT_URL = BASE_URL + VERSION + "/git";
    final public static String THEME_URL = BASE_URL + VERSION + "/themes";
    final public static String APP_TEMPLATE_URL = BASE_URL + VERSION + "/app-templates";
    final public static String USAGE_PULSE_URL = BASE_URL + VERSION + "/usage-pulse";
    final public static String TENANT_URL = BASE_URL + VERSION + "/tenants";
    final public static String CUSTOM_JS_LIB_URL = BASE_URL + VERSION + "/libraries";

    // Sub-paths
    final public static String MOCKS = "/mocks";
    final public static String RELEASE_ITEMS = "/releaseItems";
}
