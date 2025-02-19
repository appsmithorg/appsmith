package com.appsmith.external.constants.spans.ce;

import static com.appsmith.external.constants.spans.BaseSpan.APPSMITH_SPAN_PREFIX;

/**
 * Please make sure that all span names start with `appsmith.` because span with any other naming format would get
 * dropped / ignored as defined in TracingConfig.java
 */
public class ConsolidatedApiSpanNamesCE {
    public static final String CONSOLIDATED_API_PREFIX = APPSMITH_SPAN_PREFIX + "consolidated-api.";
    public static final String VIEW = "view.";
    public static final String EDIT = "edit.";
    public static final String ROOT = "root";
    public static final String CONSOLIDATED_API_ROOT_EDIT = CONSOLIDATED_API_PREFIX + EDIT + ROOT;
    public static final String CONSOLIDATED_API_ROOT_VIEW = CONSOLIDATED_API_PREFIX + VIEW + ROOT;
    public static final String USER_PROFILE_SPAN = "user_profile";
    public static final String FEATURE_FLAG_SPAN = "feature_flag";
    public static final String ORGANIZATION_SPAN = "tenant";
    public static final String PRODUCT_ALERT_SPAN = "product_alert";
    public static final String APPLICATION_ID_SPAN = "application_id";
    public static final String PAGES_SPAN = "pages";
    public static final String PAGES_DSL_SPAN = "pages_dsl_list";
    public static final String CURRENT_THEME_SPAN = "current_theme";
    public static final String THEMES_SPAN = "themes";
    public static final String CUSTOM_JS_LIB_SPAN = "js_libs";
    public static final String CURRENT_PAGE_SPAN = "current_page";
    public static final String ACTIONS_SPAN = "actions";
    public static final String ACTION_COLLECTIONS_SPAN = "action_collections";
    public static final String PLUGINS_SPAN = "plugins";
    public static final String WORKSPACE_SPAN = "workspace";
    public static final String DATASOURCES_SPAN = "datasources";
    public static final String FORM_CONFIG_SPAN = "form_config";
    public static final String MOCK_DATASOURCES_SPAN = "mock_datasources";
    public static final String ETAG_SPAN = CONSOLIDATED_API_PREFIX + VIEW + "compute_etag";
}
