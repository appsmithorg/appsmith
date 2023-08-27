import {
  agHelper,
  locators,
  entityExplorer,
  onboarding,
  draggableWidgets,
  dataSources,
  debuggerHelper,
} from "../../../../support/Objects/ObjectsCore";
import OneClickBindingLocator from "../../../../locators/OneClickBindingLocator";
const OnboardingLocator = require("../../../../locators/FirstTimeUserOnboarding.json");
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";

describe("Signposting discovery", function () {
  beforeEach(() => {
    cy.generateUUID().then((uid) => {
      cy.Signup(`${uid}@appsmithtest.com`, uid);
    });
  });
  it("1. Add datasource popup should be visible", function () {
    featureFlagIntercept({
      ab_gif_signposting_enabled: true,
    });
    agHelper.AssertElementExist("#sidebar", 0, 40000);

    cy.get(OnboardingLocator.introModal).should("be.visible");

    // Create datasource
    cy.get(OnboardingLocator.checklistDatasourceBtn).click();
    agHelper.AssertElementVisibility(onboarding.locators.add_datasources);
    agHelper.AssertElementVisibility(locators._walkthrough_overlay);
    agHelper.GetNClick(onboarding.locators.add_datasources);

    // Create query
    dataSources.CreateDataSource("Postgres", true, false);
    agHelper.AssertElementVisibility(onboarding.locators.create_query);
    agHelper.AssertElementVisibility(locators._walkthrough_overlay);
    agHelper.GetNClick(onboarding.locators.create_query);

    // Switch to widget pane
    agHelper.AssertElementVisibility(onboarding.locators.explorer_widget_tab);
    agHelper.AssertElementVisibility(locators._walkthrough_overlay);
    agHelper.GetNClick(onboarding.locators.explorer_widget_tab);
    agHelper.Sleep();

    // Drag and drop table widget
    agHelper.AssertElementVisibility(onboarding.locators.table_widget_card);
    agHelper.Sleep();
    agHelper.AssertElementVisibility(locators._walkthrough_overlay);
    entityExplorer.DragDropWidgetNVerify(
      draggableWidgets.TABLE,
      500,
      700,
      "",
      "",
      true,
    );

    // Connect data popup
    agHelper.AssertElementVisibility(onboarding.locators.connect_data_overlay);
    agHelper.AssertElementVisibility(locators._walkthrough_overlay);
    agHelper.GetNClick(onboarding.locators.connect_data_overlay, 0, true);
    agHelper.GetNClick(OneClickBindingLocator.datasourceQuerySelector());

    // Deploy button popup
    agHelper.AssertElementVisibility(onboarding.locators.deploy);
    agHelper.AssertElementVisibility(locators._walkthrough_overlay);
    agHelper.GetNClick(onboarding.locators.deploy);
  });
});
