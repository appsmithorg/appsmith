const widgetsPage = require("../../../locators/Widgets.json");
const commonlocators = require("../../../locators/commonlocators.json");
const dsl = require("../../../fixtures/commondsl.json");

describe("Table Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("Table Widget Functionality", function() {
    cy.openPropertyPane("tablewidget");
    //Checking the edit props for Table Widget and also the properties of Table widget

    cy.get(widgetsPage.tableOnRowSelected)
      .get(commonlocators.dropdownSelectButton)
      .first()
      .click({ force: true })
      .get("ul.bp3-menu")
      .children()
      .contains("Navigate To")
      .click();
    cy.wait("@updateLayout");
    cy.get(widgetsPage.tableOnRowSelected)
      .get(commonlocators.dropdownSelectButton)
      .first()
      .find("> .bp3-button-text")
      .should("have.text", "Navigate To");
    cy.get(commonlocators.editPropCrossButton).click();
  });

  afterEach(() => {
    // put your clean up code if any
  });
});

Cypress.on("test:after:run", attributes => {
  /* eslint-disable no-console */
  console.log(
    'Test "%s" has finished in %dms',
    attributes.title,
    attributes.duration,
  );
});
