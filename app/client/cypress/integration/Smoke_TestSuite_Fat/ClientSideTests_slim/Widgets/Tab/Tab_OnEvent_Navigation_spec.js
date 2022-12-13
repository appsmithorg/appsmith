const LayoutPage = require("../../../../../locators/Layout.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const dsl = require("../../../../../fixtures/tabsWidgetReset.json");
const publishPage = require("../../../../../locators/publishWidgetspage.json");

describe("Tabs widget on change of selection navigation usecases", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1.On change of tab selection Navigate to a URL", function() {
    cy.openPropertyPane("tabswidget");
    cy.get(".code-highlight")
      .children()
      .contains("No action")
      .last()
      .click({ force: true })
      .selectOnClickOption("Navigate to");
    cy.wait(5000);
    cy.get("#switcher--url").click({ force: true });
    cy.testCodeMirrorWithIndex("www.appsmith.com", 1);
    cy.wait(5000);
  });

  it("2.Publish the app and validate the navigation change on tab selection.", function() {
    cy.PublishtheApp();
    cy.wait(5000);
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
