const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/newFormDsl.json");
const pages = require("../../../../locators/Pages.json");

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
  });

  it("Property: options", function() {
    /**
     * @param{IndexValue} Provide Input Index Value
     * @param{Text} Index Text Value.
     *
     */
    cy.radioInput(0, this.data.radio1);
    cy.get(formWidgetsPage.labelSwitchGroup)
      .eq(0)
      .should("have.text", "test1");
    cy.radioInput(1, "1");
    cy.radioInput(2, this.data.radio2);
    cy.get(formWidgetsPage.labelSwitchGroup)
      .eq(1)
      .should("have.text", this.data.radio2);
    cy.radioInput(3, "2");
    cy.get(formWidgetsPage.radioAddButton).click({ force: true });
    cy.radioInput(4, this.data.radio4);
    cy.get(formWidgetsPage.deleteradiovalue)
      .eq(2)
      .click({ force: true });
    cy.wait(200);
    cy.get(formWidgetsPage.labelSwitchGroup).should("not.have.value", "test4");
  });

  it("Property: onSelectionChange", function() {
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

  it("Property: isVisible === FALSE", function() {
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.switchGroupWidget + " " + "input").should("not.exist");
  });

  it("Property: isVisible === TRUE", function() {
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.checkboxGroupWidget + " " + "input")
      .eq(0)
      .should("exist");
  });

  it("Check on text label for the control", function() {
    cy.PublishtheApp();
    cy.get(publish.switchGroupWidget + " " + "label")
      .eq(1)
      .should("have.text", "test2");
  });
});
