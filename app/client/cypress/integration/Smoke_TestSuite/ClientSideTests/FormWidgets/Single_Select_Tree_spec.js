const dsl = require("../../../../fixtures/TreeSelectDsl.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const commonlocators = require("../../../../locators/commonlocators.json");

describe("MultiSelectTree Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Selects value with enter in default value", () => {
    cy.openPropertyPane("singleselecttreewidget");
    cy.testJsontext("defaultvalue", "RED\n");
    cy.get(formWidgetsPage.singleselecttreeWidget)
      .find(".rc-tree-select-selection-item")
      .first()
      .should("have.text", "Red");
  });
  it(" To Validate Options", function() {
    cy.get(formWidgetsPage.treeSelectInput)
      .last()
      .click({ force: true });
    cy.get(formWidgetsPage.treeSelectInput)
      .last()
      .type("light");
    cy.treeSelectDropdown("Light Blue");
  });
  it("To Unchecked Visible Widget", function() {
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(
      publish.singleselecttreewidget + " " + ".rc-tree-select-single",
    ).should("not.exist");
    cy.get(publish.backToEditor).click();
  });
  it(" To Check Visible Widget", function() {
    cy.openPropertyPane("singleselecttreewidget");
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(
      publish.singleselecttreewidget + " " + ".rc-tree-select-single",
    ).should("be.visible");
    cy.get(publish.backToEditor).click();
  });

  describe("Label section", () => {
    it("Check properties: Text, Position, Alignment, Width", () => {
      const widgetName = "singleselecttreewidget";
      const labelText = "Label";
      const parentColumnSpace = 11.9375;
      const widgetSelector = `.t--widget-${widgetName}`;
      const labelSelector = `${widgetSelector} label.tree-select-label`;
      const containerSelector = `${widgetSelector} [data-testid="treeselect-container"]`;
      const labelPositionSelector = ".t--property-control-position button";
      const labelAlignmentSelector = ".t--property-control-alignment button";
      const labelWidthSelector =
        ".t--property-control-width .CodeMirror textarea";

      cy.openPropertyPane(widgetName);

      // Assert label presence
      cy.get(labelSelector)
        .first()
        .contains(labelText);
      // Assert label position: Auto
      cy.get(containerSelector).should("have.css", "flex-direction", "column");

      // Change label position to Top
      cy.get(labelPositionSelector)
        .eq(1)
        .click();
      // Assert label position: Top
      cy.get(containerSelector).should("have.css", "flex-direction", "column");

      // Change label position to Left
      cy.get(labelPositionSelector)
        .eq(2)
        .click();
      // Assert label position: Left
      cy.get(containerSelector).should("have.css", "flex-direction", "row");
      // Set label alignment to RIGHT
      cy.get(labelAlignmentSelector)
        .eq(1)
        .click();
      // Assert label alignment
      cy.get(labelSelector)
        .first()
        .should("have.css", "text-align", "right");
      // Set label width to 4 cols
      cy.get(labelWidthSelector)
        .first()
        .focus()
        .type("4");
      cy.wait(300);
      // Assert label width
      cy.get(labelSelector)
        .first()
        .should("have.css", "width", `${parentColumnSpace * 4}px`);
    });
  });
});
afterEach(() => {
  // put your clean up code if any
});
