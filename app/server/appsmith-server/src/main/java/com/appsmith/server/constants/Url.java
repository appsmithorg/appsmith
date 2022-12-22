package com.appsmith.server.constants;

public interface Url {
    String BASE_URL = "/api";
    String VERSION = "/v1";
    String LOGIN_URL = BASE_URL + VERSION + "/login";
    String LOGOUT_URL = BASE_URL + VERSION + "/logout";
    String WORKSPACE_URL = BASE_URL + VERSION + "/workspaces";
    String LAYOUT_URL = BASE_URL + VERSION + "/layouts";
    String PLUGIN_URL = BASE_URL + VERSION + "/plugins";
    String DATASOURCE_URL = BASE_URL + VERSION + "/datasources";
    String SAAS_URL = BASE_URL + VERSION + "/saas";
    String ACTION_URL = BASE_URL + VERSION + "/actions";
    String USER_URL = BASE_URL + VERSION + "/users";
    String APPLICATION_URL = BASE_URL + VERSION + "/" + Entity.APPLICATIONS;
    String PAGE_URL = BASE_URL + VERSION + "/" + Entity.PAGES;
    String CONFIG_URL = BASE_URL + VERSION + "/configs";
    String GROUP_URL = BASE_URL + VERSION + "/groups";
    String COLLECTION_URL = BASE_URL + VERSION + "/collections";
    String ACTION_COLLECTION_URL = COLLECTION_URL + "/actions";
    String IMPORT_URL = BASE_URL + VERSION + "/import";
    String PROVIDER_URL = BASE_URL + VERSION + "/providers";
    String MARKETPLACE_URL = BASE_URL + VERSION + "/marketplace";
    String API_TEMPLATE_URL = BASE_URL + VERSION + "/templates";
    String MARKETPLACE_ITEM_URL = BASE_URL + VERSION + "/items";
    String ASSET_URL = BASE_URL + VERSION + "/assets";
    String COMMENT_URL = BASE_URL + VERSION + "/comments";
    String NOTIFICATION_URL = BASE_URL + VERSION + "/notifications";
    String INSTANCE_ADMIN_URL = BASE_URL + VERSION + "/admin";
    String GIT_URL = BASE_URL + VERSION + "/git";
    String THEME_URL = BASE_URL + VERSION + "/themes";
    String APP_TEMPLATE_URL = BASE_URL + VERSION + "/app-templates";
    String USAGE_PULSE_URL = BASE_URL + VERSION + "/usage-pulse";
    String TENANT_URL = BASE_URL + VERSION + "/tenants";
    String CUSTOM_JS_LIB_URL = BASE_URL + VERSION + "/libraries";
}
