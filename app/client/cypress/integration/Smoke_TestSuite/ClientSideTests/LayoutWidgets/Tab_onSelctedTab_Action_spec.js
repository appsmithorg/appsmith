const commonlocators = require("../../../../locators/commonlocators.json");
const Layoutpage = require("../../../../locators/Layout.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/layoutdsl.json");
const pages = require("../../../../locators/Pages.json");
const modalWidgetPage = require("../../../../locators/ModalWidget.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");

describe("Tab widget test", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Tabs-AlertModal Validation", function() {
    cy.openPropertyPane("tabswidget");
    //creating the Alert Modal and verify Modal name
    cy.createModal("Alert Modal", this.data.AlertModalName);
    cy.PublishtheApp();
    cy.get(commonlocators.selectTab + ":first-child").click();
    cy.get(modalWidgetPage.modelTextField).should(
      "have.text",
      this.data.AlertModalName,
    );
  });
  it("Tabs-FormModal Validation", function() {
    cy.openPropertyPane("tabswidget");
    //creating the Form Modal and verify Modal name
    cy.updateModal("Form Modal", this.data.FormModalName);
    cy.PublishtheApp();
    cy.get(commonlocators.selectTab + ":first-child").click();
    cy.get(modalWidgetPage.modelTextField).should(
      "have.text",
      this.data.FormModalName,
    );
  });
  it("Tabs-Call-Api Validation", function() {
    //creating an api and calling it from the onClickAction of the tabs widget.
    // Creating the api
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("tabApi");
    cy.log("Creation of tabsApi Action successful");
    cy.enterDatasourceAndPath(this.data.paginationUrl, "users?page=4&size=3");
    cy.SaveAndRunAPI();

    // Going to HomePage where the tabs widget is located and opeing it's property pane.
    cy.get(widgetsPage.NavHomePage).click({ force: true });
    cy.reload();
    cy.openPropertyPane("tabswidget");

    // Adding the api in the onClickAction of the tabs widget.
    cy.addAPIFromLightningMenu("tabApi");
    // Filling the messages for success/failure in the onClickAction of the tabs widget.
    cy.onClickActions("Success", "Error", "ontabselected");

    cy.PublishtheApp();

    // Clicking the button to verify the success message
    cy.get(commonlocators.selectTab + ":first-child").click();
    cy.get(widgetsPage.apiCallToast).should("have.text", "Success");
  });

  it("Button-Call-Query Validation", function() {
    //creating a query and calling it from the onClickAction of the tabs widget.
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

    // Going to HomePage where the tabs widget is located and opeing it's property pane.
    cy.get(widgetsPage.NavHomePage).click({ force: true });
    cy.reload();
    cy.openPropertyPane("tabswidget");

    // Adding the query in the onClickAction of the tabs widget.
    cy.addQueryFromLightningMenu("Query1");
    // Filling the messages for success/failure in the onClickAction of the tabs widget.
    cy.onClickActions("Success", "Error", "ontabselected");

    cy.PublishtheApp();

    // Clicking the button to verify the success message
    cy.get(commonlocators.selectTab + ":first-child").click({ force: true });
    cy.get(widgetsPage.apiCallToast).should("have.text", "Success");
  });

  it("Toggle JS - Button-CallAnApi Validation", function() {
    cy.openPropertyPane("tabswidget");
    //creating an api and calling it from the onClickAction of the tabs widget.
    // calling the existing api
    cy.get(Layoutpage.toggleOnTabSelected).click({ force: true });
    cy.testJsontext(
      "ontabselected",
      "{{tabApi.run(() => showAlert('Success','success'), () => showAlert('Error','error'))}}",
    );

    cy.PublishtheApp();

    // Clicking the tab to verify the success message
    cy.get(commonlocators.selectTab + ":first-child").click();
    cy.get(widgetsPage.apiCallToast).should("have.text", "Success");
  });

  it("Toggle JS - Button-Call-Query Validation", function() {
    cy.openPropertyPane("tabswidget");
    //creating a query and calling it from the onClickAction of the tabs widget.
    // Creating a mock query
    cy.testJsontext(
      "ontabselected",
      "{{Query1.run(() => showAlert('Success','success'), () => showAlert('Error','error'))}}",
    );

    cy.PublishtheApp();

    // Clicking the tab to verify the success message
    cy.get(commonlocators.selectTab + ":first-child").click();
    cy.get(widgetsPage.apiCallToast).should("have.text", "Success");
    cy.get(publish.backToEditor).click();
    cy.openPropertyPane("tabswidget");
    cy.get(Layoutpage.toggleOnTabSelected).click({ force: true });
    cy.closePropertyPane();
  });
});
afterEach(() => {
  // put your clean up code if any
  cy.goToEditFromPublish();
});
