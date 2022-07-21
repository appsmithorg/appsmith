const commonlocators = require("../../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const widgetLocators = require("../../../../../locators/Widgets.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../../fixtures/newFormDsl.json");
const data = require("../../../../../fixtures/example.json");
const datasource = require("../../../../../locators/DatasourcesEditor.json");
const modalWidgetPage = require("../../../../../locators/ModalWidget.json");

describe("Dropdown Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Dropdown-Modal Validation", function() {
    cy.CheckAndUnfoldWidgets();
    cy.SearchEntityandOpen("Dropdown1");
    cy.EnableAllCodeEditors();
    cy.testJsontext("options", JSON.stringify(data.input));
    //creating the Modal and verify Modal name
    cy.createModal("Modal", this.data.ModalName);
    cy.PublishtheApp();
    // Changing the option to verify the success message
    cy.get(formWidgetsPage.selectWidget)
      .find(widgetLocators.dropdownSingleSelect)
      .click({ force: true });
    cy.get(commonlocators.singleSelectWidgetMenuItem)
      .contains("Option 2")
      .click({ force: true });
    cy.wait(1000);
    cy.get(modalWidgetPage.modelTextField).should(
      "have.text",
      this.data.ModalName,
    );
  });

  it("2. Dropdown-Call-Api Validation", function() {
    //creating an api and calling it from the onOptionChangeAction of the Dropdown widget.
    // Creating the api
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("dropdownApi");
    cy.log("Creation of buttonApi Action successful");
    cy.enterDatasourceAndPath(this.data.paginationUrl, "users?page=4&size=3");
    cy.SaveAndRunAPI();

    // Going to HomePage where the button widget is located and opeing it's property pane.
    cy.get(formWidgetsPage.NavHomePage).click({ force: true });
    cy.reload();
    cy.CheckAndUnfoldWidgets();
    cy.SearchEntityandOpen("Dropdown1");
    // Adding the api in the onClickAction of the button widget.
    cy.addAPIFromLightningMenu("dropdownApi");
    // Filling the messages for success/failure in the onClickAction of the button widget.
    cy.onClickActions("Success", "Error", "onoptionchange");

    cy.PublishtheApp();

    // Changing the option to verify the success message
    cy.get(formWidgetsPage.selectWidget)
      .find(widgetLocators.dropdownSingleSelect)
      .click({ force: true });
    cy.get(commonlocators.singleSelectWidgetMenuItem)
      .contains("Option 3")
      .click({ force: true });
    cy.get(formWidgetsPage.apiCallToast).should("have.text", "Success");
  });

  it("3. Dropdown-Call-Query Validation", function() {
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

      cy.wait("@saveDatasource").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      cy.fillPostgresDatasourceForm();
      cy.saveDatasource();
      cy.NavigateToActiveDSQueryPane(postgresDatasourceName);
    });

    cy.CreateMockQuery("Query1");

    // Going to HomePage where the button widget is located and opeing it's property pane.
    cy.get(formWidgetsPage.NavHomePage).click({ force: true });
    cy.reload();
    cy.openPropertyPane("selectwidget");
    // Adding the query in the onClickAction of the button widget.
    cy.addQueryFromLightningMenu("Query1");
    // Filling the messages for success/failure in the onClickAction of the button widget.
    cy.onClickActions("Success", "Error", "onoptionchange");

    cy.PublishtheApp();

    // Changing the option to verify the success message
    cy.get(formWidgetsPage.selectWidget)
      .find(widgetLocators.dropdownSingleSelect)
      .click({ force: true });
    cy.get(commonlocators.singleSelectWidgetMenuItem)
      .contains("Option 2")
      .click({ force: true });
    cy.get(formWidgetsPage.apiCallToast).should("have.text", "Success");
  });

  it("4. Toggle JS - Dropdown-Call-Query Validation", function() {
    //creating an api and calling it from the onOptionChangeAction of the button widget.
    // calling the existing api
    cy.SearchEntityandOpen("Dropdown1");
    cy.get(formWidgetsPage.toggleOnOptionChange).click({ force: true });
    cy.EnableAllCodeEditors();
    cy.testJsontext(
      "onoptionchange",
      "{{Query1.run(() => showAlert('Success','success'), () => showAlert('Error','error'))}}",
    );

    cy.PublishtheApp();
    // Changing the option to verify the success message
    cy.get(formWidgetsPage.selectWidget)
      .find(widgetLocators.dropdownSingleSelect)
      .click({ force: true });
    cy.get(commonlocators.singleSelectWidgetMenuItem)
      .contains("Option 2")
      .click({ force: true });
    cy.get(formWidgetsPage.apiCallToast).should("have.text", "Success");
  });

  it("5. Toggle JS - Dropdown-CallAnApi Validation", function() {
    //creating an api and calling it from the onOptionChangeAction of the button widget.
    // calling the existing api
    cy.SearchEntityandOpen("Dropdown1");
    cy.testJsontext(
      "onoptionchange",
      "{{dropdownApi.run(() => showAlert('Success','success'), () => showAlert('Error','error'))}}",
    );

    cy.PublishtheApp();
    // Changing the option to verify the success message
    cy.get(formWidgetsPage.selectWidget)
      .find(widgetLocators.dropdownSingleSelect)
      .click({ force: true });
    cy.get(commonlocators.singleSelectWidgetMenuItem)
      .contains("Option 1")
      .click({ force: true });
    cy.get(formWidgetsPage.apiCallToast).should("have.text", "Success");
    cy.get(publish.backToEditor).click();
    cy.openPropertyPane("selectwidget");
    // Click on onOptionChange JS button
    cy.get(formWidgetsPage.toggleOnOptionChange).click({ force: true });
    cy.get(commonlocators.dropdownSelectButton)
      .eq(0)
      .click();
    cy.get(commonlocators.chooseAction)
      .children()
      .contains("No action")
      .click();
  });

  it("6. Dropdown Widget Functionality to Verify On Option Change Action", function() {
    // Open property pane
    cy.SearchEntityandOpen("Dropdown1");
    // Dropdown On Option Change
    cy.addEvent("Option Changed");
    cy.PublishtheApp();
    // Change the Option
    cy.get(formWidgetsPage.selectWidget)
      .find(widgetLocators.dropdownSingleSelect)
      .click({ force: true });
    cy.get(commonlocators.singleSelectWidgetMenuItem)
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
