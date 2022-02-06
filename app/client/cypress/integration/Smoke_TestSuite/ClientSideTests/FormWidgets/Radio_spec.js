const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/newFormDsl.json");
const pages = require("../../../../locators/Pages.json");

describe("Radio Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Radio Widget Functionality", function() {
    cy.openPropertyPane("radiogroupwidget");
    /**
     * @param{Text} Random Text
     * @param{RadioWidget}Mouseover
     * @param{RadioPre Css} Assertion
     */
    cy.widgetText(
      "radiotest",
      formWidgetsPage.radioWidget,
      formWidgetsPage.radioInput,
    );
    /**
     * @param{IndexValue} Provide Input Index Value
     * @param{Text} Index Text Value.
     *
     */
    cy.radioInput(0, this.data.radio1);
    cy.get(formWidgetsPage.labelradio)
      .eq(0)
      .should("have.text", "test1");
    cy.radioInput(1, "1");
    cy.radioInput(2, this.data.radio2);
    cy.get(formWidgetsPage.labelradio)
      .eq(1)
      .should("have.text", this.data.radio2);
    cy.radioInput(3, "2");
    cy.get(formWidgetsPage.radioAddButton).click({ force: true });
    cy.radioInput(4, this.data.radio4);
    cy.get(formWidgetsPage.deleteradiovalue)
      .eq(2)
      .click({ force: true });
    cy.get(formWidgetsPage.labelradio).should("not.have.value", "test4");
    /**
     * @param{Show Alert} Css for InputChange
     */
    cy.getAlert(commonlocators.optionchangeRadioselect);
    cy.get(formWidgetsPage.defaultSelect);
    cy.get(formWidgetsPage.radioOnSelectionChangeDropdown)
      .get(commonlocators.dropdownSelectButton)
      .click({ force: true })
      .type("2");
    cy.PublishtheApp();
  });
  it("Radio Functionality To Unchecked Visible Widget", function() {
    cy.get(publish.backToEditor).click();
    cy.openPropertyPane("radiogroupwidget");
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.radioWidget + " " + "input").should("not.exist");
    cy.get(publish.backToEditor).click();
  });
  it("Radio Functionality To Check Visible Widget", function() {
    cy.openPropertyPane("radiogroupwidget");
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.radioWidget + " " + "input").should("be.checked");
  });
  it("Radio Functionality To Button Text", function() {
    cy.get(publish.radioWidget + " " + "label")
      .eq(1)
      .should("have.text", "test2");
    cy.get(publish.backToEditor).click();
  });
});
afterEach(() => {
  // put your clean up code if any
});
