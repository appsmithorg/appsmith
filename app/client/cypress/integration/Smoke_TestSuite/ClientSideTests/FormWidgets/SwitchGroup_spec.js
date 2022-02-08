const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const modalWidgetPage = require("../../../../locators/ModalWidget.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/SwitchGroupWidgetDsl.json");

describe("Switch Group Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  beforeEach(() => {
    cy.openPropertyPane("switchgroupwidget");
  });

  afterEach(() => {
    cy.goToEditFromPublish();
  });

  it("Widget name changes", function() {
    /**
     * @param{Text} Random Text
     * @param{RadioWidget}Mouseover
     * @param{RadioPre Css} Assertion
     */

    cy.widgetText(
      "switchgrouptest",
      formWidgetsPage.switchGroupWidget,
      formWidgetsPage.switchGroupInput,
    );
    cy.closePropertyPane();
  });

  it("Property: options", function() {
    // Add a new option
    const optionToAdd = { label: "Yellow", value: "YELLOW" };
    cy.get(".t--property-control-options .CodeMirror textarea")
      .first()
      .focus({ force: true })
      .type("{ctrl}{end}", { force: true })
      .type("{ctrl}{uparrow}", { force: true })
      .type("{end}", { force: true })
      .type(",{enter}")
      .type(JSON.stringify(optionToAdd), {
        parseSpecialCharSequences: false,
      });
    // Assert
    cy.get(formWidgetsPage.labelSwitchGroup)
      .should("have.length", 4)
      .eq(3)
      .contains("Yellow");
    cy.closePropertyPane();
  });

  it("Property: defaultSelectedValues", function() {
    // Add a new option
    const valueToAdd = "GREEN";
    cy.get(".t--property-control-defaultselectedvalues .CodeMirror textarea")
      .first()
      .focus({ force: true })
      .type("{ctrl}{end}", { force: true })
      .type("{ctrl}{uparrow}", { force: true })
      .type("{end}", { force: true })
      .type(",{enter}")
      .type(`"${valueToAdd}"`);
    // Assert
    cy.get(`${formWidgetsPage.labelSwitchGroup} input:checked`)
      .should("have.length", 2)
      .eq(1)
      .parent()
      .contains("Green");
    cy.closePropertyPane();
  });

  it("Property: isVisible === FALSE", function() {
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.switchGroupWidget + " " + "input").should("not.exist");
  });

  it("Property: isVisible === TRUE", function() {
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.switchGroupWidget + " " + "input")
      .eq(0)
      .should("exist");
  });

  it("Property: onSelectionChange", function() {
    // create an alert modal and verify its name
    cy.createModal(this.data.ModalName);
    cy.PublishtheApp();
    cy.get(publish.switchGroupWidget + " " + "label.bp3-switch")
      .children()
      .first()
      .click({ force: true });
    cy.get(modalWidgetPage.modelTextField).should(
      "have.text",
      this.data.ModalName,
    );
  });

  describe("Label section", () => {
    it("Check properties: Text, Position, Alignment, Width", () => {
      const widgetName = "switchgroupwidget";
      const labelText = "Name";
      const parentColumnSpace = 11.9375;
      const widgetSelector = `.t--widget-${widgetName}`;
      const labelSelector = `${widgetSelector} label.switchgroup-label`;
      const containerSelector = `${widgetSelector} [class*="SwitchGroupContainer"]`;
      const labelPositionSelector = ".t--property-control-position button";
      const labelAlignmentSelector = ".t--property-control-alignment button";
      const labelWidthSelector =
        ".t--property-control-width .CodeMirror textarea";

      cy.openPropertyPane(widgetName);

      cy.get(".t--property-control-text .CodeMirror textarea")
        .first()
        .focus()
        .type(labelText);
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
