const dsl = require("../../../../../fixtures/tabsWidgetReset.json");
const { propPane } = require("../../../../../support/Objects/ObjectsCore");
const { agHelper } = require("../../../../../support/Objects/ObjectsCore");

describe("Tabs widget on change of selection navigation usecases", function () {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1.On change of tab selection Navigate to a URL", function () {
    cy.openPropertyPane("tabswidget");
    propPane.SelectPlatformFunction("onTabSelected", "Navigate to");
    cy.wait(1000);
    agHelper.GetNClick(propPane._navigateToType("URL"));
    agHelper.EnterActionValue("Enter URL", "www.appsmith.com");
    cy.wait(1000);
    //Publish the app and validate the navigation change on tab selection
    cy.PublishtheApp();
    cy.wait(3000);
    cy.get(".t--page-switch-tab:contains('Tab 3')").click(
      { force: true },
      { multiple: true },
    );
    cy.url().should("include", "appsmith");
    cy.go("back");
    cy.get(".t--page-switch-tab:contains('Tab 3')").should("be.visible");
    //cy.get(publishPage.backToEditor).click({ force: true });
  });
});
