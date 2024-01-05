package com.appsmith.server.constants;

import java.util.Map;

import static java.util.Map.entry;

public class ConsolidatedApiAccessibilityMap {

    public static final String USER_PROFILE = "/users/me";
    public static final String FEATURE_FLAG = "/users/features";
    public static final String TENANTS = "/tenants/current";
    public static final String PRODUCT_ALERT = "/product-alert/alert";
    public static final String PAGES = "/pages";
    public static final String PUBLISHED_ACTIONS = "/actions/view";
    public static final String UNPUBLISHED_ACTIONS = "/actions";
    public static final String PUBLISHED_ACTION_COLLECTIONS = "/collections/actions/view";
    public static final String UNPUBLISHED_ACTION_COLLECTIONS = "/collections/actions";
    public static final String CURRENT_THEME = "/themes/applications/{applicationId}/current";
    public static final String THEMES = "/themes/applications/{applicationId}";
    public static final String UNPUBLISHED_PAGE_WITH_MIGRATED_DSL = "/pages/{pageId}";
    public static final String PUBLISHED_PAGE_WITH_MIGRATED_DSL = "/pages/{pageId}/view";
    public static final String PUBLISHED_JS_LIBS = "/libraries/{applicationId}/view";
    public static final String UNPUBLISHED_JS_LIBS = "/libraries/{applicationId}";
    public static final String PLUGINS = "/plugins";
    public static final String DATASOURCES = "/datasources";
    public static final String MOCK_DATASOURCES = "/datasources/mocks";
    public static final String PLUGIN_FORM_CONFIGS = "/plugins/{pluginId}/form";
    public static Map<String, Boolean> IS_API_ACCESSIBLE_TO_ANONYMOUS_USER = Map.ofEntries(
            entry(USER_PROFILE, true),
            entry(FEATURE_FLAG, true),
            entry(TENANTS, true),
            entry(PRODUCT_ALERT, true),
            entry(PAGES, true),
            entry(PUBLISHED_ACTIONS, true),
            entry(UNPUBLISHED_ACTIONS, true),
            entry(PUBLISHED_ACTION_COLLECTIONS, true),
            entry(UNPUBLISHED_ACTION_COLLECTIONS, false),
            entry(CURRENT_THEME, true),
            entry(THEMES, true),
            entry(UNPUBLISHED_PAGE_WITH_MIGRATED_DSL, true),
            entry(PUBLISHED_PAGE_WITH_MIGRATED_DSL, true),
            entry(PUBLISHED_JS_LIBS, true),
            entry(UNPUBLISHED_JS_LIBS, false),
            entry(PLUGINS, false),
            entry(DATASOURCES, false),
            entry(MOCK_DATASOURCES, false),
            entry(PLUGIN_FORM_CONFIGS, false));
}
