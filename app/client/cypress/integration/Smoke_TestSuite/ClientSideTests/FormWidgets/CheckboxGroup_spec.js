const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/checkboxgroupDsl.json");

describe("Checkbox Group Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Checkbox Group Widget Functionality", function() {
    cy.openPropertyPane("checkboxgroupwidget");
    /**
     * @param{Text} Random Text
     * @param{RadioWidget}Mouseover
     * @param{RadioPre Css} Assertion
     */
    cy.widgetText(
      "checkboxgrouptest",
      formWidgetsPage.checkboxGroupWidget,
      formWidgetsPage.checkboxGroupInput,
    );
    /**
     * @param{IndexValue} Provide Input Index Value
     * @param{Text} Index Text Value.
     *
     */
    cy.radioInput(0, this.data.radio1);
    cy.get(formWidgetsPage.labelCheckboxGroup)
      .eq(1)
      .should("have.text", "test1");
    cy.radioInput(1, "1");
    cy.radioInput(2, this.data.radio2);
    cy.get(formWidgetsPage.labelCheckboxGroup)
      .eq(2)
      .should("have.text", this.data.radio2);
    cy.radioInput(3, "2");
    cy.get(formWidgetsPage.radioAddButton).click({ force: true });
    cy.radioInput(4, this.data.radio4);
    cy.get(formWidgetsPage.deleteradiovalue)
      .eq(2)
      .click({ force: true });
    cy.wait(200);
    cy.get(formWidgetsPage.labelCheckboxGroup).should(
      "not.have.value",
      "test4",
    );
    cy.get(formWidgetsPage.deleteradiovalue)
      .eq(2)
      .click({ force: true });
    cy.wait(200);
    /**
     * @param{Show Alert} Css for InputChange
     */
    cy.getAlert(commonlocators.optionchangeRadioselect);
    cy.get(formWidgetsPage.radioOnSelectionChangeDropdown)
      .get(commonlocators.dropdownSelectButton)
      .click({ force: true })
      .type("2");
    cy.PublishtheApp();
  });

  it("2. Checkbox Group Functionality To Unchecked Visible Widget", function() {
    cy.get(publish.backToEditor).click();
    cy.openPropertyPane("checkboxgroupwidget");
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.checkboxGroupWidget + " " + "input").should("not.exist");
    cy.get(publish.backToEditor).click();
  });

  it("3. Checkbox Group Functionality To Check Visible Widget", function() {
    cy.openPropertyPane("checkboxgroupwidget");
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.checkboxGroupWidget + " " + "input")
      .eq(0)
      .should("exist");
  });

  it("4. Checkbox Group Functionality To Button Text", function() {
    cy.get(publish.checkboxGroupWidget + " " + "label")
      .eq(2)
      .should("have.text", "test2");
    cy.get(publish.backToEditor).click();
  });

  it("handleSelectAllChange: unchecked", function() {
    const selectAllSelector = formWidgetsPage.selectAllCheckboxControl;
    const uncheckedOptionInputs = `${formWidgetsPage.checkboxGroupOptionInputs} input:not(:checked)`;
    // Deselect all
    cy.get(selectAllSelector).click();
    // Should get 2 unchecked option inputs
    cy.get(uncheckedOptionInputs).should("have.length", 2);
  });

  it("handleSelectAllChange: checked", function() {
    const selectAllSelector = formWidgetsPage.selectAllCheckboxControl;
    const checkedOptionInputs = `${formWidgetsPage.checkboxGroupOptionInputs} input:checked`;
    // Select all
    cy.get(selectAllSelector).click();
    // Should get 2 checked option inputs
    cy.get(checkedOptionInputs).should("have.length", 2);
  });

  it("Checkbox Group Functionality To alignment options", function() {
    cy.openPropertyPane("checkboxgroupwidget");
    // check default value
    cy.get(".t--property-control-alignment").should("exist");
    cy.get(".t--property-control-alignment span[type='p1']").should(
      "have.text",
      "No selection.",
    );

    cy.get(
      ".t--draggable-checkboxgroupwidget div[data-cy^='checkbox-group-container']",
    ).should("have.css", "justify-content", "space-between");

    // change alignment
    cy.get(".t--property-control-alignment span[type='p1']").click({
      force: true,
    });
    cy.wait(200);
    cy.get(".t--dropdown-option")
      .contains("Start")
      .click({ force: true });
    cy.wait(400);
    cy.get(
      ".t--draggable-checkboxgroupwidget div[data-cy^='checkbox-group-container']",
    ).should("have.css", "justify-content", "flex-start");
  });

  describe("Label section", () => {
    it("Check properties: Text, Position, Alignment, Width", () => {
      const widgetName = "checkboxgroupwidget";
      const labelText = "Name";
      const parentColumnSpace = 11.9375;
      const widgetSelector = `.t--widget-${widgetName}`;
      const labelSelector = `${widgetSelector} label.checkboxgroup-label`;
      const containerSelector = `${widgetSelector} [data-testid="checkboxgroup-container"]`;
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
      cy.get(containerSelector).should("have.css", "flex-direction", "row");

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
