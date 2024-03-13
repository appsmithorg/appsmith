// Please follow naming convention : https://www.notion.so/appsmith/Using-Feature-Flags-in-Appsmith-d362fe7acc7d4ef0aa12e1f5f9b83b5f?pvs=4#f6d4242e56284e84af25cadef71b7aeb to create feature flags.
export const FEATURE_FLAG = {
  TEST_FLAG: "TEST_FLAG",
  release_datasource_environments_enabled:
    "release_datasource_environments_enabled",
  release_appnavigationlogoupload_enabled:
    "release_appnavigationlogoupload_enabled",
  release_embed_hide_share_settings_enabled:
    "release_embed_hide_share_settings_enabled",
  ab_wds_enabled: "ab_wds_enabled",
  release_table_serverside_filtering_enabled:
    "release_table_serverside_filtering_enabled",
  license_branding_enabled: "license_branding_enabled",
  license_sso_saml_enabled: "license_sso_saml_enabled",
  license_sso_oidc_enabled: "license_sso_oidc_enabled",
  license_private_embeds_enabled: "license_private_embeds_enabled",
  release_show_publish_app_to_community_enabled:
    "release_show_publish_app_to_community_enabled",
  license_gac_enabled: "license_gac_enabled",
  release_anvil_enabled: "release_anvil_enabled",
  ab_show_templates_instead_of_blank_canvas_enabled:
    "ab_show_templates_instead_of_blank_canvas_enabled",
  release_server_dsl_migrations_enabled:
    "release_server_dsl_migrations_enabled",
  license_git_branch_protection_enabled:
    "license_git_branch_protection_enabled",
  license_git_continuous_delivery_enabled:
    "license_git_continuous_delivery_enabled",
  release_git_continuous_delivery_enabled:
    "release_git_continuous_delivery_enabled",
  release_git_autocommit_feature_enabled:
    "release_git_autocommit_feature_enabled",
  license_widget_rtl_support_enabled: "license_widget_rtl_support_enabled",
  ab_create_new_apps_enabled: "ab_create_new_apps_enabled",
  release_show_partial_import_export_enabled:
    "release_show_partial_import_export_enabled",
  release_show_new_sidebar_pages_pane_enabled:
    "release_show_new_sidebar_pages_pane_enabled",
  ab_one_click_learning_popover_enabled:
    "ab_one_click_learning_popover_enabled",
  release_side_by_side_ide_enabled: "release_side_by_side_ide_enabled",
  release_global_add_pane_enabled: "release_global_add_pane_enabled",
  ab_appsmith_ai_query: "ab_appsmith_ai_query",
  rollout_consolidated_page_load_fetch_enabled:
    "rollout_consolidated_page_load_fetch_enabled",
  ab_start_with_data_default_enabled: "ab_start_with_data_default_enabled",
  release_actions_redesign_enabled: "release_actions_redesign_enabled",
  rollout_editor_pane_segments_enabled: "rollout_editor_pane_segments_enabled",
  release_show_create_app_from_templates_enabled:
    "release_show_create_app_from_templates_enabled",
  rollout_remove_feature_walkthrough_enabled:
    "rollout_remove_feature_walkthrough_enabled",
  release_drag_drop_building_blocks_enabled:
    "release_drag_drop_building_blocks_enabled",
  rollout_js_enabled_one_click_binding_enabled:
    "rollout_js_enabled_one_click_binding_enabled",
  rollout_side_by_side_enabled: "rollout_side_by_side_enabled",
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAG;

export type FeatureFlags = Record<FeatureFlag, boolean>;

export const DEFAULT_FEATURE_FLAG_VALUE: FeatureFlags = {
  TEST_FLAG: true,
  release_datasource_environments_enabled: false,
  release_appnavigationlogoupload_enabled: false,
  release_embed_hide_share_settings_enabled: false,
  ab_wds_enabled: false,
  release_table_serverside_filtering_enabled: false,
  license_branding_enabled: false,
  license_sso_saml_enabled: false,
  license_sso_oidc_enabled: false,
  license_private_embeds_enabled: false,
  release_show_publish_app_to_community_enabled: false,
  license_gac_enabled: false,
  release_anvil_enabled: false,
  ab_show_templates_instead_of_blank_canvas_enabled: false,
  release_server_dsl_migrations_enabled: false,
  release_drag_drop_building_blocks_enabled: false,
  license_git_branch_protection_enabled: false,
  release_git_autocommit_feature_enabled: false,
  license_git_continuous_delivery_enabled: false,
  release_git_continuous_delivery_enabled: false,
  license_widget_rtl_support_enabled: false,
  ab_create_new_apps_enabled: false,
  release_show_partial_import_export_enabled: false,
  release_show_new_sidebar_pages_pane_enabled: false,
  ab_one_click_learning_popover_enabled: false,
  release_side_by_side_ide_enabled: false,
  release_global_add_pane_enabled: false,
  ab_appsmith_ai_query: false,
  rollout_consolidated_page_load_fetch_enabled: false,
  ab_start_with_data_default_enabled: false,
  release_actions_redesign_enabled: false,
  rollout_editor_pane_segments_enabled: false,
  release_show_create_app_from_templates_enabled: false,
  rollout_remove_feature_walkthrough_enabled: false,
  rollout_js_enabled_one_click_binding_enabled: false,
  rollout_side_by_side_enabled: false,
};

export const AB_TESTING_EVENT_KEYS = {
  abTestingFlagLabel: "abTestingFlagLabel",
  abTestingFlagValue: "abTestingFlagValue",
};
