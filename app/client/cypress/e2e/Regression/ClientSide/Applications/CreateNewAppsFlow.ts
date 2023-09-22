import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import {
  agHelper,
  homePage,
  assertHelper,
  templates,
} from "../../../../support/Objects/ObjectsCore";

describe("Create New Apps flow using template or scratch option", function () {
  before(() => {
    featureFlagIntercept({ ab_create_new_apps_enabled: true });
    homePage.NavigateToHome();
  });

  it("1. Create on New Application and verify if the new app flow is present", function () {
    agHelper.GetNClick(homePage._homePageAppCreateBtn);
    agHelper.AssertElementVisibility(homePage._createNewAppFlowStartTemplate);
    agHelper.AssertElementVisibility(homePage._createNewAppFlowStartScratch);
    agHelper.GetNClick(homePage._createNewAppFlowGoBack);
  });

  it("2. Create on New Application and Start from template flow", function () {
    agHelper.GetNClick(homePage._homePageAppCreateBtn);
    agHelper.GetNClick(homePage._createNewAppFlowStartTemplate);
    agHelper.WaitUntilEleAppear(templates.locators._templateCard);
    agHelper.GetNClick(templates.locators._forkApp);
    assertHelper.AssertNetworkStatus("@createNewApplication", 201);
    homePage.NavigateToHome();
  });

  it("3. Create on New Application and Start from scratch flow", function () {
    agHelper.GetNClick(homePage._homePageAppCreateBtn);
    agHelper.GetNClick(homePage._createNewAppFlowStartScratch);
    assertHelper.AssertNetworkStatus("@createNewApplication", 201);
  });
});
