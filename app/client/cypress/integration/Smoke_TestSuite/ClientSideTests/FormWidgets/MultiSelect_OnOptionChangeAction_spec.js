const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const widgetLocators = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/multiSelectDsl.json");
const pages = require("../../../../locators/Pages.json");
const data = require("../../../../fixtures/example.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const modalWidgetPage = require("../../../../locators/ModalWidget.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");

describe("MultiSelect Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  beforeEach(() => {
    cy.openPropertyPane("multiselectwidget");
  });

  it("MultiSelect-AlertModal Validation", function() {
    cy.testJsontext("options", JSON.stringify(data.input));
    //creating the Alert Modal and verify Modal name
    cy.createModal("Alert Modal", this.data.AlertModalName);
    cy.PublishtheApp();
    // Changing the option to verify the success message
    cy.get(publish.multiselectwidget)
      .find(widgetLocators.defaultMultiSelectValue)
      .click({ force: true });
    cy.get(commonlocators.multiSelectMenuItem)
      .contains("Option 1")
      .click({ force: true });
    cy.wait(1000);
    cy.get(modalWidgetPage.modelTextField).should(
      "have.text",
      this.data.AlertModalName,
    );
  });

  it("MultiSelect-FromModal Validation", function() {
    //creating the Alert Modal and verify Modal name
    cy.updateModal("Form Modal", this.data.FormModalName);
    cy.PublishtheApp();
    // Changing the option to verify the success message
    cy.get(publish.multiselectwidget)
      .find(widgetLocators.defaultMultiSelectValue)
      .click({ force: true });
    cy.get(commonlocators.multiSelectMenuItem)
      .contains("Option 2")
      .click({ force: true });
    cy.get(modalWidgetPage.modelTextField).should(
      "have.text",
      this.data.FormModalName,
    );
  });

  it("MultiSelect-Call-Api Validation", function() {
    //creating an api and calling it from the onOptionChangeAction of the Dropdown widget.
    // Creating the api
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("MultiSelectAPI");
    cy.log("Creation of buttonApi Action successful");
    cy.enterDatasourceAndPath(this.data.paginationUrl, "users?page=4&size=3");
    cy.SaveAndRunAPI();

    // Going to HomePage where the button widget is located and opeing it's property pane.
    cy.get(formWidgetsPage.NavHomePage).click({ force: true });
    cy.reload();
    cy.SearchEntityandOpen("MultiSelect2");
    cy.testJsontext("options", JSON.stringify(data.input));
    // Adding the api in the onClickAction of the button widget.
    cy.addAPIFromLightningMenu("MultiSelectAPI");
    // Filling the messages for success/failure in the onClickAction of the button widget.
    cy.onClickActions("Success", "Error", "onoptionchange");

    cy.PublishtheApp();

    // Changing the option to verify the success message
    cy.get(publish.multiselectwidget)
      .find(widgetLocators.defaultMultiSelectValue)
      .click({ force: true });
    cy.get(commonlocators.multiSelectMenuItem)
      .contains("Option 3")
      .click({ force: true });
    cy.get(formWidgetsPage.apiCallToast).should("have.text", "Success");
    cy.get(publish.backToEditor).click();
  });

  it("Multiselect-Call-Query Validation", function() {
    //creating a query and calling it from the onOptionChangeAction of the Dropdown widget.
    // Creating a mock query
    // cy.CreateMockQuery("Query1");
    let postgresDatasourceName;

    cy.startRoutesForDatasource();
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgreSQL).click();
    cy.generateUUID().then((uid) => {
      postgresDatasourceName = uid;

      cy.get(".t--edit-datasource-name").click();
      cy.get(".t--edit-datasource-name input")
        .clear()
        .type(postgresDatasourceName, { force: true })
        .should("have.value", postgresDatasourceName)
        .blur();
    });
    cy.wait("@saveDatasource").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.fillPostgresDatasourceForm();
    cy.saveDatasource();

    cy.CreateMockQuery("Query1");

    // Going to HomePage where the button widget is located and opeing it's property pane.
    cy.get(formWidgetsPage.NavHomePage).click({ force: true });
    cy.reload();
    cy.openPropertyPane("multiselectwidget");
    cy.testJsontext("options", JSON.stringify(data.input));
    // Adding the query in the onClickAction of the button widget.
    cy.addQueryFromLightningMenu("Query1");
    // Filling the messages for success/failure in the onClickAction of the button widget.
    cy.onClickActions("Success", "Error", "onoptionchange");

    cy.PublishtheApp();

    // Changing the option to verify the success message
    cy.get(publish.multiselectwidget)
      .find(widgetLocators.defaultMultiSelectValue)
      .click({ force: true });
    cy.get(commonlocators.multiSelectMenuItem)
      .contains("Option 2")
      .click({ force: true });
    cy.get(formWidgetsPage.apiCallToast).should("have.text", "Success");
  });

  it("Toggle JS - Multiselect-Call-Query Validation", function() {
    //creating an api and calling it from the onOptionChangeAction of the button widget.
    // calling the existing api
    cy.get(formWidgetsPage.toggleOnOptionChange).click({ force: true });
    cy.testJsontext(
      "onoptionchange",
      "{{Query1.run(() => showAlert('Success','success'), () => showAlert('Error','error'))}}",
    );

    cy.PublishtheApp();
    // Changing the option to verify the success message
    cy.get(publish.multiselectwidget)
      .find(widgetLocators.defaultMultiSelectValue)
      .click({ force: true });
    cy.get(commonlocators.multiSelectMenuItem)
      .contains("Option 2")
      .click({ force: true });
    cy.get(formWidgetsPage.apiCallToast).should("have.text", "Success");
  });

  it("Toggle JS - Multiselect-CallAnApi Validation", function() {
    //creating an api and calling it from the onOptionChangeAction of the button widget.
    // calling the existing api
    cy.get(formWidgetsPage.toggleOnOptionChange).click({ force: true });
    cy.testJsontext(
      "onoptionchange",
      "{{MultiSelectAPI.run(() => showAlert('Success','success'), () => showAlert('Error','error'))}}",
    );

    cy.PublishtheApp();
    // Changing the option to verify the success message
    cy.get(publish.multiselectwidget)
      .find(widgetLocators.defaultMultiSelectValue)
      .click({ force: true });
    cy.get(commonlocators.multiSelectMenuItem)
      .contains("Option 1")
      .click({ force: true });
    cy.wait(1000);
    cy.get(formWidgetsPage.apiCallToast).should("have.text", "Success");
    cy.get(publish.backToEditor).click();
    cy.openPropertyPane("multiselectwidget");
    // Click on onOptionChange JS button
    cy.get(formWidgetsPage.toggleOnOptionChange).click({ force: true });
    cy.get(commonlocators.dropdownSelectButton)
      .eq(0)
      .click();
    cy.get(commonlocators.chooseAction)
      .children()
      .contains("No Action")
      .click();
    cy.testJsontext("options", "");
  });

  it("Multiselect Widget Functionality to Verify On Option Change Action", function() {
    // Open property pane
    cy.SearchEntityandOpen("MultiSelect2");
    cy.testJsontext("options", JSON.stringify(data.input));
    // Dropdown On Option Change
    cy.addAction("Option Changed");
    cy.PublishtheApp();
    // Change the Option
    cy.get(publish.multiselectwidget)
      .find(widgetLocators.defaultMultiSelectValue)
      .click({ force: true });
    cy.get(commonlocators.multiSelectMenuItem)
      .contains("Option 3")
      .click({ force: true });
    // Verify Option is changed
    cy.validateToastMessage("Option Changed");
    cy.get(publish.backToEditor).click();
  });
});
afterEach(() => {
  cy.goToEditFromPublish();
});
