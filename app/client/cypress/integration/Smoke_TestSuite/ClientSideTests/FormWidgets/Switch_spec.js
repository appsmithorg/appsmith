const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/newFormDsl.json");
const formWidgetDsl = require("../../../../fixtures/formWidgetdsl.json");
const pages = require("../../../../locators/Pages.json");

describe("Switch Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Switch Widget Functionality", function() {
    cy.openPropertyPane("switchwidget");
    /**
     * @param{Text} Random Text
     * @param{SwitchWidget}Mouseover
     * @param{SwitchPre Css} Assertion
     */
    cy.widgetText(
      "Toggler",
      formWidgetsPage.switchWidget,
      widgetsPage.switchInput,
    );
    /**
     * @param{Text} Random Value
     */
    cy.testCodeMirror(this.data.switchInputName);
    cy.get(widgetsPage.switchLabel).should("have.text", "Switch1");
    /**
     * @param{toggleButton Css} Assert to be checked
     */
    cy.togglebar(widgetsPage.defaultcheck);
    /**
     * @param{Show Alert} Css for InputChange
     */
    cy.getAlert(commonlocators.optionchangetextSwitch);
    cy.PublishtheApp();
  });
  it("Switch Functionality To Switch Label", function() {
    cy.get(publish.switchwidget + " " + "label").should(
      "have.text",
      this.data.switchInputName,
    );
    cy.get(publish.backToEditor).click();
  });
  it("Switch Functionality To Check Disabled Widget", function() {
    cy.openPropertyPane("switchwidget");
    cy.togglebar(commonlocators.Disablejs + " " + "input");
    cy.PublishtheApp();
    cy.get(publish.switchwidget + " " + "input").should("be.disabled");
    cy.get(publish.backToEditor).click();
  });
  it("Switch Functionality To Check Enabled Widget", function() {
    cy.openPropertyPane("switchwidget");
    cy.togglebarDisable(commonlocators.Disablejs + " " + "input");
    cy.PublishtheApp();
    cy.get(publish.switchwidget + " " + "input").should("be.enabled");
    cy.get(publish.backToEditor).click();
  });
  it("Switch Functionality To Unchecked Visible Widget", function() {
    cy.openPropertyPane("switchwidget");
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.switchwidget + " " + "input").should("not.exist");
    cy.get(publish.backToEditor).click();
  });
  it("Switch Functionality To Check Visible Widget", function() {
    cy.openPropertyPane("switchwidget");
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.switchwidget + " " + "input").should("be.checked");
    cy.get(publish.backToEditor).click();
  });

  it("Switch Functionality To swap label placement of  switch", function() {
    cy.openPropertyPane("switchwidget");
    cy.get(publish.switchwidget + " " + ".bp3-align-right").should("not.exist");
    cy.get(publish.switchwidget + " " + ".bp3-align-left").should("exist");
    cy.get(commonlocators.optionalignment)
      .last()
      .click();
    cy.dropdownDynamicUpdated("Right");
    cy.PublishtheApp();
    cy.get(publish.switchwidget + " " + ".bp3-align-right").should("exist");
    cy.get(publish.switchwidget + " " + ".bp3-align-left").should("not.exist");
    cy.get(publish.backToEditor).click();
  });
});
afterEach(() => {
  // put your clean up code if any
});
