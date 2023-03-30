const widgetsPage = require("../../../../../locators/Widgets.json");
const dsl = require("../../../../../fixtures/newFormDsl.json");
const publishPage = require("../../../../../locators/publishWidgetspage.json");
const modalWidgetPage = require("../../../../../locators/ModalWidget.json");
const datasource = require("../../../../../locators/DatasourcesEditor.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Button Widget Functionality", function () {
  before(() => {
    cy.addDsl(dsl);
  });

  beforeEach(() => {
    cy.openPropertyPane("buttonwidget");
  });

  it("1. Button-Modal Validation", function () {
    //creating the Modal and verify Modal name
    cy.createModal(this.data.ModalName, "onClick");
    cy.PublishtheApp();
    cy.get(publishPage.buttonWidget).should("be.visible");
    cy.get(publishPage.buttonWidget).click();
    cy.get("body").then(($ele) => {
      if ($ele.find(modalWidgetPage.modelTextField).length <= 0) {
        cy.get(publishPage.buttonWidget).click({ force: true });
      }
    });
    cy.get(modalWidgetPage.modelTextField).should(
      "have.text",
      this.data.ModalName,
    );
  });

  it("2. Button-CallAnApi Validation", function () {
    //creating an api and calling it from the onClickAction of the button widget.
    // Creating the api
    _.propPane.ClearActionField("onClick");
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("buttonApi");
    cy.log("Creation of buttonApi Action successful");
    cy.enterDatasourceAndPath(
      this.data.paginationUrl,
      "mock-api?records=20&page=4&size=3",
    );
    cy.SaveAndRunAPI();

    // Going to HomePage where the button widget is located and opening it's property pane.
    cy.get(widgetsPage.NavHomePage).click({ force: true });
    cy.reload();
    cy.openPropertyPane("buttonwidget");

    // Adding the api in the onClickAction of the button widget.
    cy.executeDbQuery("buttonApi", "onClick");
    // Filling the messages for success/failure in the onClickAction of the button widget.
    cy.onClickActions("Success", "Error", "Execute a query", "buttonApi.run");

    cy.PublishtheApp();
    cy.get("body").then(($ele) => {
      if ($ele.find(widgetsPage.apiCallToast).length <= 0) {
        cy.get(publishPage.buttonWidget).click();
      }
    });
    // Clicking the button to verify the success message
    cy.get(publishPage.buttonWidget).click();
    cy.get("body").then(($ele) => {
      if ($ele.find(widgetsPage.apiCallToast).length <= 0) {
        cy.get(publishPage.buttonWidget).click();
      }
    });
    cy.get(widgetsPage.apiCallToast).should("have.text", "Success");
  });

  it("3. Button-Call-Query Validation", function () {
    //creating a query and calling it from the onClickAction of the button widget.
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

      cy.fillPostgresDatasourceForm();
      cy.saveDatasource();
      cy.NavigateToActiveDSQueryPane(postgresDatasourceName);
    });

    cy.CreateMockQuery("Query1");

    // Going to HomePage where the button widget is located and opeing it's property pane.
    cy.get(widgetsPage.NavHomePage).click({ force: true });
    cy.reload();
    cy.openPropertyPane("buttonwidget");

    // Adding the query in the onClickAction of the button widget.
    cy.executeDbQuery("Query1", "onClick");
    // Filling the messages for success/failure in the onClickAction of the button widget.
    cy.onClickActions("Success", "Error", "Execute a query", "Query1.run");

    cy.PublishtheApp();

    // Clicking the button to verify the success message
    cy.get(publishPage.buttonWidget).click();
    cy.get("body").then(($ele) => {
      if ($ele.find(widgetsPage.apiCallToast).length <= 0) {
        cy.get(publishPage.buttonWidget).click();
      }
    });
    cy.get(widgetsPage.apiCallToast).should("have.text", "Success");
  });

  it("4. Toggle JS - Button-CallAnApi Validation", function () {
    //creating an api and calling it from the onClickAction of the button widget.
    // calling the existing api
    cy.get(widgetsPage.toggleOnClick).click({ force: true });
    _.propPane.UpdatePropertyFieldValue(
      "onClick",
      "{{buttonApi.run(() => showAlert('Success','success'), () => showAlert('Error','error'))}}",
    );

    cy.PublishtheApp();

    // Clicking the button to verify the success message
    cy.get(publishPage.buttonWidget).click();
    cy.get("body").then(($ele) => {
      if ($ele.find(widgetsPage.apiCallToast).length <= 0) {
        cy.get(publishPage.buttonWidget).click();
      }
    });
    cy.get(widgetsPage.apiCallToast).should("have.text", "Success");
  });

  it("5. Toggle JS - Button-Call-Query Validation", function () {
    //creating a query and calling it from the onClickAction of the button widget.
    // Creating a mock query
    _.propPane.UpdatePropertyFieldValue(
      "onClick",
      "{{Query1.run(() => showAlert('Success','success'), () => showAlert('Error','error'))}}",
    );

    cy.PublishtheApp();

    // Clicking the button to verify the success message
    cy.get(publishPage.buttonWidget).click();
    cy.get("body").then(($ele) => {
      if ($ele.find(widgetsPage.apiCallToast).length <= 0) {
        cy.get(publishPage.buttonWidget).click();
        cy.wait(3000);
      }
    });
    cy.get(widgetsPage.apiCallToast).should("have.text", "Success");
  });

  it("6. Toggle JS - Button-Call-SetTimeout Validation", function () {
    //creating a query and calling it from the onClickAction of the button widget.
    // Creating a mock query
    _.propPane.UpdatePropertyFieldValue(
      "onClick",
      "{{setTimeout(() => showAlert('Hello from setTimeout after 3 seconds'), 3000)}}",
    );

    cy.PublishtheApp();

    // Clicking the button to verify the success message
    cy.get(publishPage.buttonWidget).click();
    cy.wait(3000);
    cy.get("body").then(($ele) => {
      if ($ele.find(widgetsPage.apiCallToast).length <= 0) {
        cy.get(publishPage.buttonWidget).click();
        cy.wait(3000);
      }
    });
    cy.get(widgetsPage.apiCallToast).should(
      "have.text",
      "Hello from setTimeout after 3 seconds",
    );
  });

  afterEach(() => {
    cy.goToEditFromPublish();
  });
});
