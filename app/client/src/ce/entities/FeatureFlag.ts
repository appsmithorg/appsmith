// Please follow naming convention : https://www.notion.so/appsmith/Using-Feature-Flags-in-Appsmith-d362fe7acc7d4ef0aa12e1f5f9b83b5f?pvs=4#f6d4242e56284e84af25cadef71b7aeb to create feature flags.
export const FEATURE_FLAG = {
  TEST_FLAG: "TEST_FLAG",
  release_datasource_environments_enabled:
    "release_datasource_environments_enabled",
  release_appnavigationlogoupload_enabled:
    "release_appnavigationlogoupload_enabled",
  release_embed_hide_share_settings_enabled:
    "release_embed_hide_share_settings_enabled",
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
  license_git_branch_protection_enabled:
    "license_git_branch_protection_enabled",
  license_git_continuous_delivery_enabled:
    "license_git_continuous_delivery_enabled",
  license_widget_rtl_support_enabled: "license_widget_rtl_support_enabled",
  ab_one_click_learning_popover_enabled:
    "ab_one_click_learning_popover_enabled",
  release_side_by_side_ide_enabled: "release_side_by_side_ide_enabled",
  release_global_add_pane_enabled: "release_global_add_pane_enabled",
  ab_appsmith_ai_query: "ab_appsmith_ai_query",
  release_actions_redesign_enabled: "release_actions_redesign_enabled",
  rollout_remove_feature_walkthrough_enabled:
    "rollout_remove_feature_walkthrough_enabled",
  release_drag_drop_building_blocks_enabled:
    "release_drag_drop_building_blocks_enabled",
  release_table_cell_label_value_enabled:
    "release_table_cell_label_value_enabled",
  rollout_side_by_side_enabled: "rollout_side_by_side_enabled",
  release_layout_conversion_enabled: "release_layout_conversion_enabled",
  release_anvil_toggle_enabled: "release_anvil_toggle_enabled",
  release_git_persist_branch_enabled: "release_git_persist_branch_enabled",
  release_ide_animations_enabled: "release_ide_animations_enabled",
  release_ide_datasource_selector_enabled:
    "release_ide_datasource_selector_enabled",
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAG;

export type FeatureFlags = Record<FeatureFlag, boolean>;

export const DEFAULT_FEATURE_FLAG_VALUE: FeatureFlags = {
  TEST_FLAG: true,
  release_datasource_environments_enabled: false,
  release_appnavigationlogoupload_enabled: false,
  release_embed_hide_share_settings_enabled: false,
  release_table_serverside_filtering_enabled: false,
  license_branding_enabled: false,
  license_sso_saml_enabled: false,
  license_sso_oidc_enabled: false,
  license_private_embeds_enabled: false,
  release_show_publish_app_to_community_enabled: false,
  license_gac_enabled: false,
  release_anvil_enabled: false,
  release_drag_drop_building_blocks_enabled: false,
  release_table_cell_label_value_enabled: false,
  license_git_branch_protection_enabled: false,
  license_git_continuous_delivery_enabled: false,
  license_widget_rtl_support_enabled: false,
  ab_one_click_learning_popover_enabled: false,
  release_side_by_side_ide_enabled: false,
  release_global_add_pane_enabled: false,
  ab_appsmith_ai_query: false,
  release_actions_redesign_enabled: false,
  rollout_remove_feature_walkthrough_enabled: true,
  rollout_side_by_side_enabled: false,
  release_layout_conversion_enabled: false,
  release_anvil_toggle_enabled: false,
  release_git_persist_branch_enabled: false,
  release_ide_animations_enabled: false,
  release_ide_datasource_selector_enabled: false,
};

export const AB_TESTING_EVENT_KEYS = {
  abTestingFlagLabel: "abTestingFlagLabel",
  abTestingFlagValue: "abTestingFlagValue",
};
