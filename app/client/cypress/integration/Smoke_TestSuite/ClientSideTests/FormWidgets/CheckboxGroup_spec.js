const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/checkboxgroupDsl.json");
const pages = require("../../../../locators/Pages.json");

describe("Checkbox Group Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Checkbox Group Widget Functionality", function() {
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
  it("Checkbox Group Functionality To Unchecked Visible Widget", function() {
    cy.get(publish.backToEditor).click();
    cy.openPropertyPane("checkboxgroupwidget");
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.checkboxGroupWidget + " " + "input").should("not.exist");
    cy.get(publish.backToEditor).click();
  });
  it("Checkbox Group Functionality To Check Visible Widget", function() {
    cy.openPropertyPane("checkboxgroupwidget");
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.checkboxGroupWidget + " " + "input")
      .eq(0)
      .should("exist");
  });
  it("Checkbox Group Functionality To Button Text", function() {
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
    // Should get 3 unchecked option inputs
    cy.get(uncheckedOptionInputs).should("have.length", 3);
  });

  it("handleSelectAllChange: checked", function() {
    const selectAllSelector = formWidgetsPage.selectAllCheckboxControl;
    const checkedOptionInputs = `${formWidgetsPage.checkboxGroupOptionInputs} input:checked`;
    // Select all
    cy.get(selectAllSelector).click();
    // Should get 3 checked option inputs
    cy.get(checkedOptionInputs).should("have.length", 3);
  });
});
afterEach(() => {
  // put your clean up code if any
});
