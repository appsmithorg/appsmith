const widgetsPage = require("../../../../../locators/Widgets.json");
const dsl = require("../../../../../fixtures/formSelectTreeselectDsl.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");

describe("Form Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Validate Select and TreeSelect Widget", function() {
    cy.get(widgetsPage.formButtonWidget)
      .contains("Submit")
      .should("have.attr", "disabled");
    cy.get(formWidgetsPage.treeSelectInput)
      .last()
      .click({ force: true });
    cy.get(formWidgetsPage.treeSelectFilterInput)
      .click()
      .type("Blue");
    cy.treeSelectDropdown("Blue");

    cy.get(formWidgetsPage.dropdownWidget)
      .find(widgetsPage.dropdownSingleSelect)
      .click({
        force: true,
      });
    cy.wait(2000);
    cy.get(".select-popover-wrapper")
      .contains("Blue")
      .click({ force: true });
    cy.wait(2000);
    cy.get(widgetsPage.formButtonWidget)
      .contains("Submit")
      .should("not.have.attr", "disabled");
  });
});
