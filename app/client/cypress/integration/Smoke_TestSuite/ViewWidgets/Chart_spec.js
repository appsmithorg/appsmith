const commonlocators = require("../../../locators/commonlocators.json");
const viewWidgetsPage = require("../../../locators/ViewWidgets.json");
const dsl = require("../../../fixtures/viewdsl.json");

describe("Chart Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("Chart Widget Functionality", function() {
    cy.openPropertyPane("chartwidget");
    //Checking the edit props for Chart and also the properties of Chart widget
    cy.testCodeMirror("App Sign Up");
    cy.get(viewWidgetsPage.chartSelectChartType)
      .find(".bp3-button")
      .click({ force: true })
      .get("ul.bp3-menu")
      .children()
      .contains("Bar Chart")
      .click();
    cy.get(viewWidgetsPage.chartSelectChartType)
      .find(".bp3-button > .bp3-button-text")
      .should("have.text", "Bar Chart");
    cy.get(commonlocators.editPropCrossButton).click();
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
