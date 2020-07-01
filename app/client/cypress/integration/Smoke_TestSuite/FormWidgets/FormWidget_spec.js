const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");
const publish = require("../../../locators/publishWidgetspage.json");
const dsl = require("../../../fixtures/formdsl.json");

describe("Form Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Form Widget Functionality", function() {
    cy.openPropertyPane("formwidget");
    /**
     * @param{Text} Random Text
     * @param{FormWidget}Mouseover
     * @param{FormPre Css} Assertion
     */
    cy.widgetText(
      "FormTest",
      formWidgetsPage.formWidget,
      formWidgetsPage.formInner,
    );
    /**
     * @param{Text} Random Colour
     */
    cy.testCodeMirror(this.data.colour);
    cy.get(formWidgetsPage.formD)
      .should("have.css", "background-color")
      .and("eq", this.data.rgbValue);
    /**
     * @param{toggleButton Css} Assert to be checked
     */
    cy.togglebar(commonlocators.scrollView);
    cy.get(formWidgetsPage.formD)
      .scrollTo("bottom")
      .should("be.visible");
    cy.get(commonlocators.editPropCrossButton).click();
    cy.PublishtheApp();
  });
  it("Form Widget Functionality To Verify The Colour", function() {
    cy.get(formWidgetsPage.formD)
      .should("have.css", "background-color")
      .and("eq", this.data.rgbValue);
  });
  it("Form Widget Functionality To Unchecked Visible Widget", function() {
    cy.get(publish.backToEditor).click();
    cy.openPropertyPane("formwidget");
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.formWidget).should("not.be.visible");
    cy.get(publish.backToEditor).click();
  });
  it("Form Widget Functionality To Check Visible Widget", function() {
    cy.openPropertyPane("formwidget");
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.formWidget).should("be.visible");
    cy.get(publish.backToEditor).click();
  });
});
afterEach(() => {
  // put your clean up code if any
});
