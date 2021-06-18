const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/newFormDsl.json");
const formWidgetDsl = require("../../../../fixtures/formWidgetdsl.json");
const pages = require("../../../../locators/Pages.json");

describe("Checkbox Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Checkbox Widget Functionality", function() {
    cy.openPropertyPane("checkboxwidget");
    /**
     * @param{Text} Random Text
     * @param{CheckboxWidget}Mouseover
     * @param{CheckboxPre Css} Assertion
     */
    cy.widgetText(
      "checker",
      formWidgetsPage.checkboxWidget,
      widgetsPage.checkboxInput,
    );
    /**
     * @param{Text} Random Value
     */
    cy.testCodeMirror(this.data.checkbocInputName);
    cy.get(widgetsPage.checkboxLabel).should("have.text", "value");
    /**
     * @param{toggleButton Css} Assert to be checked
     */
    cy.togglebar(widgetsPage.defaultcheck);
    /**
     * @param{Show Alert} Css for InputChange
     */
    cy.getAlert(commonlocators.optionchangetextCheckbox);
    cy.PublishtheApp();
  });
  it("Checkbox Functionality To Check Label", function() {
    cy.get(publish.checkboxWidget + " " + "label").should(
      "have.text",
      this.data.checkbocInputName,
    );
    cy.get(publish.backToEditor).click();
  });
  it("Checkbox Functionality To Check Disabled Widget", function() {
    cy.openPropertyPane("checkboxwidget");
    cy.togglebar(commonlocators.Disablejs + " " + "input");
    cy.PublishtheApp();
    cy.get(publish.checkboxWidget + " " + "input").should("be.disabled");
    cy.get(publish.backToEditor).click();
  });
  it("Checkbox Functionality To Check Enabled Widget", function() {
    cy.openPropertyPane("checkboxwidget");
    cy.togglebarDisable(commonlocators.Disablejs + " " + "input");
    cy.PublishtheApp();
    cy.get(publish.checkboxWidget + " " + "input").should("be.enabled");
    cy.get(publish.backToEditor).click();
  });
  it("Checkbox Functionality To Unchecked Visible Widget", function() {
    cy.openPropertyPane("checkboxwidget");
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.checkboxWidget + " " + "input").should("not.exist");
    cy.get(publish.backToEditor).click();
  });
  it("Checkbox Functionality To Check Visible Widget", function() {
    cy.openPropertyPane("checkboxwidget");
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.checkboxWidget + " " + "input").should("be.checked");
    cy.get(publish.backToEditor).click();
  });

  it("Checkbox Functionality To Check required toggle for form", function() {
    cy.addDsl(formWidgetDsl);
    cy.openPropertyPane("checkboxwidget");
    cy.togglebar(commonlocators.requiredjs + " " + "input");
    cy.PublishtheApp();
    cy.get(publish.checkboxWidget).click();
    cy.get(widgetsPage.formButtonWidget)
      .contains("Submit")
      .should("have.attr", "disabled");

    cy.get(publish.checkboxWidget).click();
    cy.get(widgetsPage.formButtonWidget)
      .contains("Submit")
      .should("not.have.attr", "disabled");

    cy.get(publish.backToEditor).click();
  });
  it("Checkbox Functionality To swap label placement of  checkbox", function() {
    cy.openPropertyPane("checkboxwidget");
    cy.get(publish.checkboxWidget + " " + ".bp3-align-right").should(
      "not.exist",
    );
    cy.get(publish.checkboxWidget + " " + ".bp3-align-left").should("exist");
    cy.get(commonlocators.optionalignment)
      .last()
      .click();
    cy.dropdownDynamicUpdated("Right");
    cy.PublishtheApp();
    cy.get(publish.checkboxWidget + " " + ".bp3-align-right").should("exist");
    cy.get(publish.checkboxWidget + " " + ".bp3-align-left").should(
      "not.exist",
    );
    cy.get(publish.backToEditor).click();
  });
});
afterEach(() => {
  // put your clean up code if any
});
