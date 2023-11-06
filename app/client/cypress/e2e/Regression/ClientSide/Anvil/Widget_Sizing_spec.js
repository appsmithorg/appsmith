import { getWidgetSelector } from "../../../../locators/WidgetLocators";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import {
  agHelper,
  draggableWidgets,
  entityExplorer,
  homePage,
  propPane,
} from "../../../../support/Objects/ObjectsCore";

let buttonWidth = 0;
describe("widgets should assume proper sizes based on their responsiveBehaviour", () => {
  const flags = {
    APP_NAVIGATION_LOGO_UPLOAD: false,
    ab_ai_button_sql_enabled: true,
    ab_ai_js_function_completion_enabled: true,
    ab_create_new_apps_enabled: false,
    ab_ds_binding_enabled: true,
    ab_ds_schema_enabled: true,
    ab_env_walkthrough_a_enabled: false,
    ab_gif_signposting_enabled: false,
    ab_gsheet_schema_enabled: false,
    ab_mock_mongo_schema_enabled: false,
    ab_show_templates_instead_of_blank_canvas_enabled: true,
    ab_wds_enabled: true,
    ask_ai: false,
    ask_ai_js: false,
    ask_ai_sql: false,
    deprecate_custom_fusioncharts_enabled: false,
    license_audit_logs_enabled: false,
    license_branding_enabled: false,
    license_connection_pool_size_enabled: false,
    license_custom_environments_enabled: false,
    license_gac_enabled: false,
    license_git_unlimited_repo_enabled: false,
    license_message_listener_enabled: false,
    license_multiple_env_enabled: false,
    license_pac_enabled: false,
    license_private_embeds_enabled: false,
    license_scheduled_backup_enabled: false,
    license_scim_enabled: false,
    license_session_limit_enabled: false,
    license_sso_oidc_enabled: false,
    license_sso_saml_enabled: false,
    license_widget_rtl_support_enabled: false,
    release_anvil_enabled: true,
    release_app_sidebar_enabled: false,
    release_appnavigationlogoupload_enabled: false,
    release_custom_echarts_enabled: false,
    release_custom_environments_enabled: false,
    release_datasource_environments_enabled: false,
    release_embed_hide_share_settings_enabled: false,
    release_git_branch_protection_enabled: false,
    release_git_connect_v2_enabled: false,
    release_git_status_lite_enabled: false,
    release_knowledge_base_enabled: false,
    release_query_module_enabled: false,
    release_server_dsl_migrations_enabled: false,
    release_show_publish_app_to_community_enabled: false,
    release_table_serverside_filtering_enabled: false,
    release_widgetdiscovery_enabled: false,
    release_workflows_enabled: false,
    rollout_datasource_test_rate_limit_enabled: false,
  };
  before(() => {
    featureFlagIntercept(flags);

    agHelper.Sleep(2000);

    homePage.NavigateToHome();
    homePage.CreateNewApplication();

    agHelper.Sleep();
  });
  it("Hug widgets should take up the size based on their content", () => {
    entityExplorer.AnvilDragDropWidgetNVerify(
      draggableWidgets.WDS_BUTTON,
      100,
      200,
      "#anvil-canvas-0 > .layout-index-0",
      false,
      draggableWidgets.BUTTON,
    );

    agHelper.GetWidgetCSSFrAttribute(
      getWidgetSelector(draggableWidgets.WDS_BUTTON),
      "width"
    ).then((width) => {
      cy.log("width", width);
      buttonWidth = width;
    });

    cy.openPropertyPane(draggableWidgets.WDS_BUTTON);
    cy.testJsontext("label", "A very long label");

    agHelper.GetWidgetCSSFrAttribute(
      getWidgetSelector(draggableWidgets.WDS_BUTTON),
      "width"
    ).then((width) => {
      expect(width).to.be.greaterThan(buttonWidth);
      cy.log("width", width, buttonWidth);
    });
  });
});
