import {
  agHelper,
  apiPage,
  table,
} from "../../../../support/Objects/ObjectsCore";

import OneClickBinding from "../../../../locators/OneClickBindingLocator";
import FirstTimeUserOnboarding from "../../../../locators/FirstTimeUserOnboarding.json";

describe("Test Create Api and Bind to Table widget V2", function () {
  before(() => {
    agHelper.AddDsl("tableV2WidgetDsl");
  });

  it("1. Test_Add users api, execute it and go to sniping mode.", function () {
    cy.fixture("TestDataSet1").then(function (dataSet) {
      apiPage.CreateAndFillApi(dataSet.userApi + "/mock-api?records=10");
    });
    apiPage.RunAPI();
    cy.get(FirstTimeUserOnboarding.selectWidgetInCanvas).click();
    cy.get(FirstTimeUserOnboarding.snipingBanner).should("be.visible");
    //Click on table name controller to bind the data and exit sniping mode
    cy.get(table._tableV2Widget).trigger("mouseover");
    cy.get(FirstTimeUserOnboarding.snipingControl).click();
    cy.get(OneClickBinding.datasourceDropdownSelector).contains("Api1");
    cy.get(FirstTimeUserOnboarding.snipingBanner).should("not.exist");
  });
});
