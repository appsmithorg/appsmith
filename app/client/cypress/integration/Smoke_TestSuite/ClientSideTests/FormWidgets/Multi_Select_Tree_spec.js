const dsl = require("../../../../fixtures/TreeSelectDsl.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const commonlocators = require("../../../../locators/commonlocators.json");

describe("MultiSelectTree Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Selects value with enter in default value", () => {
    cy.openPropertyPane("multiselecttreewidget");
    cy.testJsontext("defaultvalue", "RED\n");
    cy.get(formWidgetsPage.multiselecttreeWidget)
      .find(".rc-tree-select-selection-item-content")
      .first()
      .should("have.text", "Red");
  });
  it(" To Validate Options", function() {
    cy.get(formWidgetsPage.treeSelectInput)
      .first()
      .click({ force: true });
    cy.get(formWidgetsPage.treeSelectInput)
      .first()
      .type("light");
    cy.treeMultiSelectDropdown("Light Blue");
  });
  it("To Unchecked Visible Widget", function() {
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(
      publish.multiselecttreewidget + " " + ".rc-tree-select-multiple",
    ).should("not.exist");
    cy.get(publish.backToEditor).click();
  });
  it(" To Check Visible Widget", function() {
    cy.openPropertyPane("multiselecttreewidget");
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(
      publish.multiselecttreewidget + " " + ".rc-tree-select-multiple",
    ).should("be.visible");
    cy.get(publish.backToEditor).click();
  });
});
afterEach(() => {
  // put your clean up code if any
});
