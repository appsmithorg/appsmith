const commonlocators = require("../../../locators/commonlocators.json");
const dsl = require("../../../fixtures/commondsl.json");
const widgetsPage = require("../../../locators/Widgets.json");
const publish = require("../../../locators/publishWidgetspage.json");

describe("Input Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Input Widget Functionality", function() {
    cy.openPropertyPane("inputwidget");
    /**
     * @param{Text} Random Text
     * @param{InputWidget}Mouseover
     * @param{InputPre Css} Assertion
     */
    cy.widgetText("day", widgetsPage.inputWidget, widgetsPage.inputval);
    cy.get(widgetsPage.datatype)
      .find(commonlocators.dropdownbuttonclick)
      .click({ force: true })
      .get(commonlocators.dropdownmenu)
      .children()
      .contains("Text")
      .click();
    cy.get(widgetsPage.innertext)
      .click({ force: true })
      .type(this.data.para);
    cy.get(publish.inputWidget + " " + "input")
      .invoke("attr", "value")
      .should("contain", this.data.para);
    cy.openPropertyPane("inputwidget");
    cy.get(widgetsPage.defaultInput)
      .type(this.data.command)
      .type(this.data.defaultdata);
    cy.get(publish.inputWidget + " " + "input")
      .invoke("attr", "value")
      .should("contain", this.data.defaultdata);
    cy.get(widgetsPage.placeholder)
      .type(this.data.command)
      .type(this.data.placeholder);
    /**
     * @param{Widget} Widget InnerCss
     */
    cy.get(widgetsPage.innertext)
      .invoke("attr", "placeholder")
      .should("contain", this.data.placeholder);
    cy.get(widgetsPage.Regex)
      .click()
      .type(this.data.regex);
    /**
     * @param{Show Alert} Css for InputChange
     */
    cy.getAlert(commonlocators.optionchangetextInput);
    cy.PublishtheApp();
  });
  it("Input Widget Functionality To Validate Default Text and Placeholder", function() {
    cy.get(publish.inputWidget + " " + "input")
      .invoke("attr", "value")
      .should("contain", this.data.defaultdata);
    cy.get(publish.inputWidget + " " + "input")
      .invoke("attr", "placeholder")
      .should("contain", this.data.placeholder);
    cy.get(publish.backToEditor).click({ force: true });
  });
  it("Input Widget Functionality To Check Disabled Widget", function() {
    cy.openPropertyPane("inputwidget");
    cy.togglebar(commonlocators.Disablejs + " " + "input");
    cy.PublishtheApp();
    cy.get(publish.inputWidget + " " + "input").should("be.disabled");
    cy.get(publish.backToEditor).click({ force: true });
  });
  it("Input Widget Functionality To Check Enabled Widget", function() {
    cy.openPropertyPane("inputwidget");
    cy.togglebarDisable(commonlocators.Disablejs + " " + "input");
    cy.PublishtheApp();
    cy.get(publish.inputWidget + " " + "input").should("be.enabled");
    cy.get(publish.backToEditor).click({ force: true });
  });
  it("Input Functionality To Unchecked Visible Widget", function() {
    cy.openPropertyPane("inputwidget");
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.inputWidget + " " + "input").should("not.be.visible");
    cy.get(publish.backToEditor).click({ force: true });
  });
  it("Input Functionality To Check Visible Widget", function() {
    cy.openPropertyPane("inputwidget");
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.inputWidget + " " + "input").should("be.visible");
    cy.get(publish.backToEditor).click({ force: true });
  });
});
afterEach(() => {
  // put your clean up code if any
});
