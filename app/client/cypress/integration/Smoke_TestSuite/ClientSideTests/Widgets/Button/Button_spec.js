const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const dsl = require("../../../../../fixtures/newFormDsl.json");
const publishPage = require("../../../../../locators/publishWidgetspage.json");

const iconAlignmentProperty = ".t--property-control-iconalignment";

describe("Button Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  beforeEach(() => {
    cy.openPropertyPane("buttonwidget");
  });

  it("Icon alignment should not change when changing the icon", () => {
    // Add an icon
    cy.get(".t--property-control-icon .bp3-icon-caret-down").click({
      force: true,
    });

    cy.get(".bp3-icon-add")
      .first()
      .click({
        force: true,
      });

    // Assert if the icon exists
    cy.get(`${widgetsPage.buttonWidget} .bp3-icon-add`).should("exist");
    // Change icon alignment to right
    cy.get(`${iconAlignmentProperty} .t--button-tab-right`)
      .last()
      .click({
        force: true,
      });
    cy.wait(200);
    // Assert if the icon appears on the right hand side of the button text
    cy.get(widgetsPage.buttonWidget)
      .contains("Submit")
      .children("span")
      .should("have.length", 2);
    cy.get(`${widgetsPage.buttonWidget} span.bp3-button-text`)
      .next()
      .should("have.class", "bp3-icon-add");
    // Change the existing icon
    cy.get(".t--property-control-icon .bp3-icon-caret-down").click({
      force: true,
    });
    cy.get(".bp3-icon-airplane")
      .first()
      .click({
        force: true,
      });
    // Assert if the icon changes
    // Assert if the icon still exists on the right side of the text
    cy.get(`${widgetsPage.buttonWidget} .bp3-icon-airplane`)
      .should("exist")
      .prev()
      .should("have.text", "Submit");
  });

  it("Button-Color Validation", function() {
    // Change button color
    cy.changeButtonColor("rgb(255, 0, 0)");
  });

  it("Button default variant validation", function() {
    // Checks whether the default variant is PRIMARY or not
    cy.get(widgetsPage.widgetBtn).should(
      "have.attr",
      "data-test-variant",
      "PRIMARY",
    );
  });

  it("Button-Name validation", function() {
    //changing the Button Name
    cy.widgetText(
      this.data.ButtonName,
      widgetsPage.buttonWidget,
      widgetsPage.buttonWidget + " " + commonlocators.widgetNameTag,
    );

    //Changing the text on the Button
    cy.testJsontext("label", this.data.ButtonLabel);
    cy.get(commonlocators.evaluatedTypeTitle)
      .first()
      .find("span")
      .click();
    cy.EvaluateDataType("string");
    cy.EvaluateCurrentValue(this.data.ButtonLabel);

    cy.assertPageSave();

    //Verify the Button name and label
    cy.get(widgetsPage.buttonWidget).trigger("mouseover");
    cy.get(widgetsPage.buttonWidget + " span.bp3-button-text").should(
      "have.text",
      this.data.ButtonLabel,
    );
    cy.PublishtheApp();
    cy.get(publishPage.buttonWidget + " span.bp3-button-text").should(
      "have.text",
      this.data.ButtonLabel,
    );
  });

  it("Button-Disable Validation", function() {
    //Check the disableed checkbox and Validate
    cy.CheckWidgetProperties(commonlocators.disableCheckbox);
    cy.validateDisableWidget(
      widgetsPage.buttonWidget,
      commonlocators.disabledField,
    );
    cy.PublishtheApp();
    cy.validateDisableWidget(
      publishPage.buttonWidget,
      commonlocators.disabledField,
    );
  });

  it("Button-Enable Validation", function() {
    //Uncheck the disabled checkbox and validate
    cy.UncheckWidgetProperties(commonlocators.disableCheckbox);
    cy.validateEnableWidget(
      widgetsPage.buttonWidget,
      commonlocators.disabledField,
    );
    cy.PublishtheApp();
    cy.validateEnableWidget(
      publishPage.buttonWidget,
      commonlocators.disabledField,
    );
  });

  it("Toggle JS - Button-Disable Validation", function() {
    //Check the disabled checkbox by using JS widget and Validate
    cy.get(widgetsPage.toggleDisable).click({ force: true });
    cy.testJsontext("disabled", "true");
    cy.validateDisableWidget(
      widgetsPage.buttonWidget,
      commonlocators.disabledField,
    );
    cy.PublishtheApp();
    cy.validateDisableWidget(
      publishPage.buttonWidget,
      commonlocators.disabledField,
    );
  });

  it("Toggle JS - Button-Enable Validation", function() {
    //Uncheck the disabled checkbox and validate
    cy.testJsontext("disabled", "false");
    cy.validateEnableWidget(
      widgetsPage.buttonWidget,
      commonlocators.disabledField,
    );
    cy.PublishtheApp();
    cy.validateEnableWidget(
      publishPage.buttonWidget,
      commonlocators.disabledField,
    );
  });

  it("Button-Unckeck Visible field Validation", function() {
    //Uncheck the disabled checkbox and validate
    cy.UncheckWidgetProperties(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publishPage.buttonWidget).should("not.exist");
  });

  it("Button-Check Visible field Validation", function() {
    //Check the disableed checkbox and Validate
    cy.CheckWidgetProperties(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publishPage.buttonWidget).should("be.visible");
  });

  it("Toggle JS - Button-Unckeck Visible field Validation", function() {
    //Uncheck the disabled checkbox using JS and validate
    cy.get(widgetsPage.toggleVisible).click({ force: true });
    cy.EnableAllCodeEditors();
    cy.testJsontext("visible", "false");
    cy.PublishtheApp();
    cy.get(publishPage.buttonWidget).should("not.exist");
  });

  it("Toggle JS - Button-Check Visible field Validation", function() {
    //Check the disabled checkbox using JS and Validate
    cy.EnableAllCodeEditors();
    cy.testJsontext("visible", "true");
    cy.PublishtheApp();
    cy.get(publishPage.buttonWidget).should("be.visible");
  });

  it("Button-Check recaptcha type can be selected", function() {
    cy.selectDropdownValue(commonlocators.recaptchaVersion, "reCAPTCHA v2");
    cy.get(commonlocators.recaptchaVersion)
      .last()
      .should("have.text", "reCAPTCHA v2");
  });

  it("Button-Copy Verification", function() {
    //Copy button and verify all properties
    cy.copyWidget("buttonwidget", widgetsPage.buttonWidget);

    // cy.PublishtheApp();
  });

  it("Button-Delete Verification", function() {
    // Delete the button widget
    cy.deleteWidget(widgetsPage.buttonWidget);
    cy.PublishtheApp();
    cy.get(widgetsPage.buttonWidget).should("not.exist");
  });

  afterEach(() => {
    cy.goToEditFromPublish();
  });
});
