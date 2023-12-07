// Please follow naming convention : https://www.notion.so/appsmith/Using-Feature-Flags-in-Appsmith-d362fe7acc7d4ef0aa12e1f5f9b83b5f?pvs=4#f6d4242e56284e84af25cadef71b7aeb to create feature flags.
export const FEATURE_FLAG = {
  TEST_FLAG: "TEST_FLAG",
  release_datasource_environments_enabled:
    "release_datasource_environments_enabled",
  release_appnavigationlogoupload_enabled:
    "release_appnavigationlogoupload_enabled",
  release_embed_hide_share_settings_enabled:
    "release_embed_hide_share_settings_enabled",
  ab_gsheet_schema_enabled: "ab_gsheet_schema_enabled",
  ab_wds_enabled: "ab_wds_enabled",
  release_table_serverside_filtering_enabled:
    "release_table_serverside_filtering_enabled",
  release_custom_echarts_enabled: "release_custom_echarts_enabled",
  license_branding_enabled: "license_branding_enabled",
  release_git_status_lite_enabled: "release_git_status_lite_enabled",
  license_sso_saml_enabled: "license_sso_saml_enabled",
  license_sso_oidc_enabled: "license_sso_oidc_enabled",
  release_git_connect_v2_enabled: "release_git_connect_v2_enabled",
  deprecate_custom_fusioncharts_enabled:
    "deprecate_custom_fusioncharts_enabled",
  ab_mock_mongo_schema_enabled: "ab_mock_mongo_schema_enabled",
  license_private_embeds_enabled: "license_private_embeds_enabled",
  release_show_publish_app_to_community_enabled:
    "release_show_publish_app_to_community_enabled",
  license_gac_enabled: "license_gac_enabled",
  release_anvil_enabled: "release_anvil_enabled",
  ab_show_templates_instead_of_blank_canvas_enabled:
    "ab_show_templates_instead_of_blank_canvas_enabled",
  release_app_sidebar_enabled: "release_app_sidebar_enabled",
  release_server_dsl_migrations_enabled:
    "release_server_dsl_migrations_enabled",
  license_git_branch_protection_enabled:
    "license_git_branch_protection_enabled",
  license_widget_rtl_support_enabled: "license_widget_rtl_support_enabled",
  release_custom_widgets_enabled: "release_custom_widgets_enabled",
  ab_create_new_apps_enabled: "ab_create_new_apps_enabled",
  release_show_new_sidebar_announcement_enabled:
    "release_show_new_sidebar_announcement_enabled",
  rollout_app_sidebar_enabled: "rollout_app_sidebar_enabled",
  release_show_partial_import_export_enabled:
    "release_show_partial_import_export_enabled",
  release_show_new_sidebar_pages_pane_enabled:
    "release_show_new_sidebar_pages_pane_enabled",
  ab_one_click_learning_popover_enabled:
    "ab_one_click_learning_popover_enabled",
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAG;

export type FeatureFlags = Record<FeatureFlag, boolean>;

export const DEFAULT_FEATURE_FLAG_VALUE: FeatureFlags = {
  TEST_FLAG: true,
  release_datasource_environments_enabled: false,
  release_appnavigationlogoupload_enabled: false,
  release_embed_hide_share_settings_enabled: false,
  ab_gsheet_schema_enabled: false,
  ab_wds_enabled: false,
  release_table_serverside_filtering_enabled: false,
  release_custom_echarts_enabled: false,
  license_branding_enabled: false,
  release_git_status_lite_enabled: false,
  license_sso_saml_enabled: false,
  license_sso_oidc_enabled: false,
  release_git_connect_v2_enabled: false,
  deprecate_custom_fusioncharts_enabled: false,
  ab_mock_mongo_schema_enabled: false,
  license_private_embeds_enabled: false,
  release_show_publish_app_to_community_enabled: false,
  license_gac_enabled: false,
  release_anvil_enabled: false,
  ab_show_templates_instead_of_blank_canvas_enabled: false,
  release_app_sidebar_enabled: false,
  release_server_dsl_migrations_enabled: false,
  license_git_branch_protection_enabled: false,
  license_widget_rtl_support_enabled: false,
  release_custom_widgets_enabled: false,
  ab_create_new_apps_enabled: false,
  release_show_new_sidebar_announcement_enabled: false,
  rollout_app_sidebar_enabled: false,
  release_show_partial_import_export_enabled: false,
  release_show_new_sidebar_pages_pane_enabled: false,
  ab_one_click_learning_popover_enabled: false,
};

export const AB_TESTING_EVENT_KEYS = {
  abTestingFlagLabel: "abTestingFlagLabel",
  abTestingFlagValue: "abTestingFlagValue",
};
