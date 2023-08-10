import {
  agHelper,
  apiPage,
  table,
  tedTestConfig,
} from "../../../../support/Objects/ObjectsCore";

import OneClickBinding from "../../../../locators/OneClickBindingLocator";
import FirstTimeUserOnboarding from "../../../../locators/FirstTimeUserOnboarding.json";

describe("Test Create Api and Bind to Table widget V2", function () {
  before(() => {
    agHelper.AddDsl("tableV2WidgetDsl");
  });

  it("1. Test_Add users api, execute it and go to sniping mode.", function () {
    apiPage.CreateAndFillApi(
      tedTestConfig.dsValues[tedTestConfig.defaultEnviorment].mockApiUrl,
    );
    apiPage.RunAPI();
    agHelper.GetNClick(FirstTimeUserOnboarding.selectWidgetBtn);
    agHelper.AssertElementVisibility(FirstTimeUserOnboarding.snipingBanner);
    //Click on table name controller to bind the data and exit sniping mode
    agHelper.GetNClick(table._tableV2Widget);
    agHelper.AssertContains(
      "Api1",
      "exist",
      OneClickBinding.datasourceDropdownSelector,
    );
    agHelper.AssertElementAbsence(FirstTimeUserOnboarding.snipingBanner);
  });
});
