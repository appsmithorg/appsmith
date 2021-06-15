const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/newFormDsl.json");
const homePage = require("../../../../locators/HomePage.json");
const pages = require("../../../../locators/Pages.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");
const modalWidgetPage = require("../../../../locators/ModalWidget.json");

describe("Button Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  beforeEach(() => {
    cy.openPropertyPane("buttonwidget");
  });

  it("Button-Style Validation", function() {
    //Changing the style of the button from the property pane and verify it's color.
    // Change to Secondary button sytle
    cy.changeButtonStyle(2, "rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)");
    cy.get(publishPage.backToEditor).click({ force: true });
    // Change to Danger button sytle
    cy.openPropertyPane("buttonwidget");
    cy.changeButtonStyle(3, "rgb(179, 3, 56)", "rgb(139, 2, 43)");
    cy.get(publishPage.backToEditor).click({ force: true });
    // Change to Primary button sytle
    cy.openPropertyPane("buttonwidget");
    cy.changeButtonStyle(1, "rgb(3, 179, 101)", "rgb(2, 139, 78)");
  });

  it("Button-Name validation", function() {
    //changing the Button Name
    cy.widgetText(
      this.data.ButtonName,
      widgetsPage.buttonWidget,
      widgetsPage.buttonWidget + " " + commonlocators.widgetNameTag,
    );

    //Changing the text on the Button
    cy.testCodeMirror(this.data.ButtonLabel);
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
    cy.EditWidgetPropertiesUsingJS(widgetsPage.inputToggleDisable, "true");
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
    cy.EditWidgetPropertiesUsingJS(widgetsPage.inputToggleDisable, "false");
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
    cy.EditWidgetPropertiesUsingJS(widgetsPage.inputToggleVisible, "false");
    cy.PublishtheApp();
    cy.get(publishPage.buttonWidget).should("not.exist");
  });

  it("Toggle JS - Button-Check Visible field Validation", function() {
    //Check the disabled checkbox using JS and Validate
    cy.EditWidgetPropertiesUsingJS(widgetsPage.inputToggleVisible, "true");
    cy.PublishtheApp();
    cy.get(publishPage.buttonWidget).should("be.visible");
  });

  it("Button-AlertModal Validation", function() {
    //creating the Alert Modal and verify Modal name
    cy.createModal("Alert Modal", this.data.AlertModalName);
    cy.PublishtheApp();
    cy.get(publishPage.buttonWidget).click();
    cy.get(modalWidgetPage.modelTextField).should(
      "have.text",
      this.data.AlertModalName,
    );
  });

  it("Button-FormModal Validation", function() {
    //creating the Form Modal and verify Modal name
    cy.updateModal("Form Modal", this.data.FormModalName);
    cy.PublishtheApp();
    cy.get(publishPage.buttonWidget).click();
    cy.get(modalWidgetPage.modelTextField).should(
      "have.text",
      this.data.FormModalName,
    );
  });

  it("Button-CallAnApi Validation", function() {
    //creating an api and calling it from the onClickAction of the button widget.
    // Creating the api
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("buttonApi");
    cy.log("Creation of buttonApi Action successful");
    cy.enterDatasourceAndPath(this.data.paginationUrl, "users?page=4&size=3");
    cy.SaveAndRunAPI();

    // Going to HomePage where the button widget is located and opeing it's property pane.
    cy.get(widgetsPage.NavHomePage).click({ force: true });
    cy.reload();
    cy.openPropertyPane("buttonwidget");

    // Adding the api in the onClickAction of the button widget.
    cy.addAPIFromLightningMenu("buttonApi");
    // Filling the messages for success/failure in the onClickAction of the button widget.
    cy.onClickActions("Success", "Error");
    cy.wait(2000);

    cy.PublishtheApp();

    // Clicking the button to verify the success message
    cy.get(publishPage.buttonWidget).click();
    cy.get(widgetsPage.apiCallToast).should("have.text", "Success");
  });

  it("Toggle JS - Button-CallAnApi Validation", function() {
    //creating an api and calling it from the onClickAction of the button widget.
    // calling the existing api
    cy.get(widgetsPage.toggleOnClick).click({ force: true });
    cy.testJsontext(
      "onclick",
      "{{buttonApi.run(() => showAlert('Success','success'), () => showAlert('Error','error'))}}",
    );
    cy.wait(2000);

    cy.PublishtheApp();

    // Clicking the button to verify the success message
    cy.get(publishPage.buttonWidget).click();
    cy.get(widgetsPage.apiCallToast).should("have.text", "Success");
  });

  it("Button-Call-Query Validation", function() {
    //creating a query and calling it from the onClickAction of the button widget.
    // Creating a mock query
    cy.CreateMockQuery("Query1");

    // Going to HomePage where the button widget is located and opeing it's property pane.
    cy.get(widgetsPage.NavHomePage).click({ force: true });
    cy.reload();
    cy.openPropertyPane("buttonwidget");

    // Adding the query in the onClickAction of the button widget.
    cy.addQueryFromLightningMenu("Query1");
    // Filling the messages for success/failure in the onClickAction of the button widget.
    cy.onClickActions("Success", "Error");
    cy.wait(2000);

    cy.PublishtheApp();

    // Clicking the button to verify the success message
    cy.get(publishPage.buttonWidget).click();
    cy.get(widgetsPage.apiCallToast).should("have.text", "Success");
  });

  it("Toggle JS - Button-Call-Query Validation", function() {
    //creating a query and calling it from the onClickAction of the button widget.
    // Creating a mock query
    cy.get(widgetsPage.toggleOnClick).click({ force: true });
    cy.testJsontext(
      "onclick",
      "{{Query1.run(() => showAlert('Success','success'), () => showAlert('Error','error'))}}",
    );

    cy.PublishtheApp();

    // Clicking the button to verify the success message
    cy.get(publishPage.buttonWidget).click();
    cy.get(widgetsPage.apiCallToast).should("have.text", "Success");
  });

  it("Button-Copy Verification", function() {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    //Copy button and verify all properties
    cy.get(widgetsPage.propertypaneText)
      .children()
      .last()
      .invoke("text")
      .then((originalButton) => {
        cy.log(originalButton);
        cy.get(widgetsPage.copyWidget).click();
        cy.reload();
        // Wait for the button to be appear in the DOM and press Ctrl/Cmd + V to paste the button.
        cy.get(widgetsPage.buttonWidget).should("exist");
        cy.get("body").type(`{${modifierKey}}v`);
        cy.wait(2000);
        cy.openPropertyPaneCopy("buttonwidget");
        cy.get(widgetsPage.propertypaneText)
          .children()
          .last()
          .invoke("text")
          .then((copiedButton) => {
            cy.log(copiedButton);
            expect(originalButton).to.be.equal(copiedButton);
          });
      });

    cy.PublishtheApp();
  });

  it("Button-Delete Verification", function() {
    // Delete the button widget
    cy.get(widgetsPage.removeWidget).click();
    cy.get(widgetsPage.deleteToast).should("have.text", "UNDO");
    cy.PublishtheApp();
    cy.get(widgetsPage.buttonWidget).should("not.exist");
  });

  afterEach(() => {
    cy.get(publishPage.backToEditor).click({ force: true });
  });
});
