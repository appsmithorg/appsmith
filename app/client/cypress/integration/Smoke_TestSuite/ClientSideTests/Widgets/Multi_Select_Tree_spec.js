const dsl = require("../../../../fixtures/TreeSelectDsl.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const explorer = require("../../../../locators/explorerlocators.json");

describe("MultiSelectTree Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Check isDirty meta property", function() {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("textwidget", { x: 300, y: 500 });
    cy.openPropertyPane("textwidget");
    cy.updateCodeInput(
      ".t--property-control-text",
      `{{MultiSelectTree1.isDirty}}`,
    );
    // Change defaultValue
    cy.openPropertyPane("multiselecttreewidget");
    cy.testJsontext("defaultvalue", "GREEN\n");
    // Check if isDirty is set to false
    cy.get(".t--widget-textwidget").should("contain", "false");
    // Interact with UI
    cy.get(formWidgetsPage.treeSelectInput)
      .first()
      .click({ force: true });
    cy.treeMultiSelectDropdown("Red");
    // Check if isDirty is set to true
    cy.get(".t--widget-textwidget").should("contain", "true");
    // Reset isDirty by changing defaultValue
    cy.testJsontext("defaultvalue", "BLUE\n");
    // Check if isDirty is set to false
    cy.get(".t--widget-textwidget").should("contain", "false");
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
    cy.get(formWidgetsPage.multiTreeSelectFilterInput)
      .click()
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
