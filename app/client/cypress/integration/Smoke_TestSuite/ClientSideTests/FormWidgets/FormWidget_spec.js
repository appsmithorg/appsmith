const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/formdsl.json");
const pages = require("../../../../locators/Pages.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const explorer = require("../../../../locators/explorerlocators.json");

describe("Form Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Default Form text,  Reset and Close button Validation", function() {
    cy.get(widgetsPage.textWidget).should("be.visible");
    cy.get(widgetsPage.formButtonWidget)
      .contains("Submit")
      .scrollIntoView()
      .should("be.visible");
    cy.get(widgetsPage.formButtonWidget)
      .contains("Reset")
      .scrollIntoView()
      .should("be.visible");
  });
  it("Add Multiple widgets in Form", function() {
    cy.get(explorer.addWidget).click();
    cy.get(commonlocators.entityExplorersearch).should("be.visible");
    cy.dragAndDropToWidget("multiselectwidgetv2", "formwidget", {
      x: 100,
      y: 100,
    });
    cy.wait(500);
    cy.dragAndDropToWidget("inputwidgetv2", "formwidget", { x: 50, y: 200 });
    cy.get(formWidgetsPage.multiselectwidgetv2).should("be.visible");
    cy.get(widgetsPage.inputWidget).should("be.visible");
    cy.PublishtheApp();
  });
  it("Form_Widget Minimize and maximize General Validation", function() {
    cy.openPropertyPane("formwidget");
    cy.get(commonlocators.generalChevran).click({ force: true });
    cy.get(commonlocators.generalSection).should("not.be.visible");
    cy.get(commonlocators.generalChevran).click({ force: true });
    cy.get(commonlocators.generalSection).should("be.visible");
    cy.PublishtheApp();
  });
  it("Rename Form widget from Entity Explorer", function() {
    cy.GlobalSearchEntity("Form1");
    cy.RenameEntity("Form");
    cy.wait(1000);
    cy.get(".t--entity").should("contain", "Form");
  });
  it("Form Widget Functionality", function() {
    // cy.openPropertyPane("formwidget");
    // /**
    //  * @param{Text} Random Text
    //  * @param{FormWidget}Mouseover
    //  * @param{FormPre Css} Assertion
    //  */
    // // Change the form name
    // cy.widgetText(
    //   "FormTest",
    //   formWidgetsPage.formWidget,
    //   formWidgetsPage.formInner,
    // );
    // /**
    //  * @param{Text} Random Colour
    //  */
    // // Change the form  background color
    // cy.get(widgetsPage.backgroundcolorPicker)
    //   .first()
    //   .click({ force: true });
    // cy.xpath(widgetsPage.greenColor).click();
    // // Verify the form background color
    // cy.get(formWidgetsPage.formD)
    //   .should("have.css", "background-color")
    //   .and("eq", "rgb(128, 128, 128)");
    // /**
    //  * @param{toggleButton Css} Assert to be checked
    //  */
    // // Check the Scroll and verify
    // cy.togglebar(commonlocators.scrollView);
    // cy.get(formWidgetsPage.formD)
    //   .scrollTo("bottom")
    //   .should("be.visible");
    // // Close the form propert pane
    // cy.get(commonlocators.editPropCrossButton).click({ force: true });
  });
  it("Form Widget Functionality To Verify The Colour", function() {
    cy.PublishtheApp();
    cy.get(formWidgetsPage.formD)
      .should("have.css", "background-color")
      .and("eq", "rgb(128, 128, 128)");
  });
  it("Form Widget Functionality To Unchecked Visible Widget", function() {
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
  it("Toggle JS - Form-Unckeck Visible field Validation", function() {
    cy.openPropertyPane("formwidget");
    //Uncheck the disabled checkbox using JS and validate
    cy.get(widgetsPage.toggleVisible).click({ force: true });
    cy.testJsontext("visible", "false");
    cy.PublishtheApp();
    cy.get(publish.formWidget).should("not.exist");
  });

  it("Toggle JS - Form-Check Visible field Validation", function() {
    cy.openPropertyPane("formwidget");
    //Check the disabled checkbox using JS and Validate
    cy.testJsontext("visible", "true");
    cy.PublishtheApp();
    cy.get(publish.formWidget).should("be.visible");
  });
  it("Form-Copy Verification", function() {
    cy.openPropertyPane("formwidget");
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    //Copy Form and verify all properties
    cy.copyWidget("formwidget", widgetsPage.formWidget);

    cy.PublishtheApp();
  });

  /*
  it("Form-Delete Verification", function() {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    cy.openPropertyPane("formwidget");
    // Delete the Form widget
    cy.get("body").type("{del}", { force: true });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    //cy.deleteWidget(widgetsPage.formWidget);
    cy.PublishtheApp();
    cy.get(widgetsPage.formWidget).should("not.exist");
  });
  */
});
afterEach(() => {
  // put your clean up code if any
  cy.goToEditFromPublish();
});
