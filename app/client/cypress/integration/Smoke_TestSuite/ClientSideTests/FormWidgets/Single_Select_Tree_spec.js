const dsl = require("../../../../fixtures/TreeSelectDsl.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const commonlocators = require("../../../../locators/commonlocators.json");

describe("Single Select Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Selects value with enter in default value", () => {
    cy.openPropertyPane("singleselecttreewidget");
    cy.testJsontext("defaultvalue", "RED\n");
    cy.get(formWidgetsPage.singleselecttreeWidget)
      .find(".rc-tree-select-selection-item")
      .first()
      .should("have.text", "Red");
  });

  it("2. To Validate Options", function() {
    cy.get(formWidgetsPage.treeSelectInput)
      .last()
      .click({ force: true });
    cy.get(formWidgetsPage.treeSelectFilterInput)
      .click()
      .type("light");
    cy.treeSelectDropdown("Light Blue");
  });

  it("3. Clears the search field when widget is closed", () => {
    cy.get(formWidgetsPage.treeSelectInput)
      .last()
      .click({ force: true });
    cy.get(formWidgetsPage.treeSelectFilterInput)
      .click()
      .type("Green");
    cy.treeSelectDropdown("Green");
    cy.get(formWidgetsPage.singleselecttreeWidget)
      .find(".rc-tree-select-selection-item")
      .first()
      .should("have.text", "Green");
    cy.get(formWidgetsPage.treeSelectInput)
      .last()
      .click({ force: true });
    cy.get(formWidgetsPage.treeSelectFilterInput)
      .invoke("val")
      .should("be.empty");
  });

  it("4. To Unchecked Visible Widget", function() {
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(
      publish.singleselecttreewidget + " " + ".rc-tree-select-single",
    ).should("not.exist");
    cy.get(publish.backToEditor).click();
  });

  it("5. To Check Visible Widget", function() {
    cy.openPropertyPane("singleselecttreewidget");
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(
      publish.singleselecttreewidget + " " + ".rc-tree-select-single",
    ).should("be.visible");
    cy.get(publish.backToEditor).click();
  });

  it("6. Check isDirty meta property", function() {
    cy.openPropertyPane("textwidget");
    cy.updateCodeInput(
      ".t--property-control-text",
      `{{SingleSelectTree1.isDirty}}`,
    );
    // Change defaultText
    cy.openPropertyPane("singleselecttreewidget");
    cy.updateCodeInput(".t--property-control-defaultvalue", "GREEN");
    cy.closePropertyPane();
    // Check if isDirty is reset to false
    cy.get(".t--widget-textwidget").should("contain", "false");
    // Interact with UI
    cy.get(formWidgetsPage.treeSelectInput)
      .last()
      .click({ force: true });
    cy.get(formWidgetsPage.treeSelectFilterInput)
      .click()
      .type("light");
    cy.treeSelectDropdown("Light Blue");
    // Check if isDirty is set to true
    cy.get(".t--widget-textwidget").should("contain", "true");
    // Change defaultText
    cy.openPropertyPane("singleselecttreewidget");
    cy.updateCodeInput(".t--property-control-defaultvalue", "RED");
    // Check if isDirty is reset to false
    cy.get(".t--widget-textwidget").should("contain", "false");
  });
});
afterEach(() => {
  // put your clean up code if any
});
