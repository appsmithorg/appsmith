const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const dsl = require("../../../../../fixtures/SelectDslWithEmptyOptions.json");

describe("MultiSelect, Tree Select and Multi Tree Select Widget Empty Options Functionality", function () {
  before(() => {
    cy.addDsl(dsl);
  });
  it("1. To Check empty options for Multi Select Tree Widget", () => {
    cy.get(formWidgetsPage.treeSelectInput).first().click({ force: true });
    cy.get(".rc-tree-select-empty").should("have.text", "No Results Found");

    //To Check empty options for Single Select Tree Widget"
    cy.get(formWidgetsPage.treeSelectInput)
      .last()
      .click({ force: true })
      .get(".single-tree-select-dropdown .rc-tree-select-empty")
      .should("have.text", "No Results Found");

    //To Check empty options for Multi Select Widget
    cy.get(formWidgetsPage.mulitiselectInput).eq(0).click({ force: true });
    cy.get(".rc-select-item-empty").should("have.text", "No Results Found");
  });
});
afterEach(() => {
  // put your clean up code if any
});
