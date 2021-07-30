const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/formdsl.json");
const pages = require("../../../../locators/Pages.json");
const widgetsPage = require("../../../../locators/Widgets.json");

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
    // Change the form name
    cy.widgetText(
      "FormTest",
      formWidgetsPage.formWidget,
      formWidgetsPage.formInner,
    );
    /**
     * @param{Text} Random Colour
     */
    // Change the form  background color
    cy.get(widgetsPage.backgroundcolorPicker)
      .first()
      .click({ force: true });
    cy.xpath(widgetsPage.greenColor).click();
    // Verify the form background color
    cy.get(formWidgetsPage.formD)
      .should("have.css", "background-color")
      .and("eq", "rgb(3, 179, 101)");
    /**
     * @param{toggleButton Css} Assert to be checked
     */
    // Check the Scroll and verify
    cy.togglebar(commonlocators.scrollView);
    cy.get(formWidgetsPage.formD)
      .scrollTo("bottom")
      .should("be.visible");
    // Close the form propert pane
    cy.get(commonlocators.editPropCrossButton).click({ force: true });
    cy.PublishtheApp();
  });
  it("Form Widget Functionality To Verify The Colour", function() {
    // Verify form background color
    cy.get(formWidgetsPage.formD)
      .should("have.css", "background-color")
      .and("eq", "rgb(3, 179, 101)");
  });
  it("Form Widget Functionality To Unchecked Visible Widget", function() {
    cy.get(publish.backToEditor).click();
    // Open property pane
    cy.openPropertyPane("formwidget");
    // Uncheck the visble JS
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    // Verify the unchecked visible JS
    cy.get(publish.formWidget).should("not.exist");
    cy.get(publish.backToEditor).click();
  });
  it("Form Widget Functionality To Check Visible Widget", function() {
    // Open property pone
    cy.openPropertyPane("formwidget");
    // Check the visible JS
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    // Verify the Checked Visible JS
    cy.get(publish.formWidget).should("be.visible");
    cy.get(publish.backToEditor).click();
  });
});
afterEach(() => {
  // put your clean up code if any
});
