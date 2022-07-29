const dsl = require("../../../../../fixtures/TreeSelectDsl.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const explorer = require("../../../../../locators/explorerlocators.json");

describe("MultiSelectTree Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Check isDirty meta property", function() {
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

  it("2. Selects value with enter in default value", () => {
    cy.openPropertyPane("multiselecttreewidget");
    cy.testJsontext("defaultvalue", "RED\n");
    cy.get(formWidgetsPage.multiselecttreeWidget)
      .find(".rc-tree-select-selection-item-content")
      .first()
      .should("have.text", "Red");
    // Clear the selected value
    cy.get(formWidgetsPage.treeSelectInput)
      .first()
      .click({ force: true });
    cy.treeMultiSelectDropdown("Red");
  });

  it("3. Clears the search field when widget is closed", () => {
    // open the multi-tree select widget
    // search for option Red in the search input
    cy.get(formWidgetsPage.multiTreeSelectFilterInput)
      .click()
      .type("Green");
    // select the Green option
    cy.treeMultiSelectDropdown("Green");
    // Assert the selected value is Green
    cy.get(formWidgetsPage.multiselecttreeWidget)
      .find(".rc-tree-select-selection-item-content")
      .first()
      .should("have.text", "Green");
    // Reopen the multi-tree select widget
    cy.get(formWidgetsPage.treeSelectInput)
      .first()
      .click({ force: true });
    // Assert if the search input is empty now
    cy.get(formWidgetsPage.multiTreeSelectFilterInput)
      .invoke("val")
      .should("be.empty");
    cy.wait(100);
  });

  it("4. To Validate Options", function() {
    cy.get(formWidgetsPage.treeSelectInput)
      .first()
      .click({ force: true });
    cy.get(formWidgetsPage.multiTreeSelectFilterInput)
      .click()
      .type("light");
    cy.treeMultiSelectDropdown("Light Blue");
  });

  it("5. To Unchecked Visible Widget", function() {
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(
      publish.multiselecttreewidget + " " + ".rc-tree-select-multiple",
    ).should("not.exist");
    cy.get(publish.backToEditor).click();
  });

  it("6. To Check Visible Widget", function() {
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
