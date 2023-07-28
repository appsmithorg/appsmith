const widgetsPage = require("../../../../../locators/Widgets.json");
const publishPage = require("../../../../../locators/publishWidgetspage.json");
const modalWidgetPage = require("../../../../../locators/ModalWidget.json");
import { agHelper, dataSources, deployMode, entityExplorer, locators, propPane } from "../../../../../support/Objects/ObjectsCore";

describe("Button Widget Functionality", function () {
  before(() => {
    agHelper.AddDsl("newFormDsl");
  });

  beforeEach(() => {
    cy.openPropertyPane("buttonwidget");
  });

  it("1. Button-Modal Validation", function () {
    //creating the Modal and verify Modal name
    cy.createModal(this.dataSet.ModalName, "onClick");
    deployMode.DeployApp();
    cy.wait(5000); //for page to load fully - for CI exclusively
    cy.get(publishPage.buttonWidget).should("be.visible");
    cy.get(publishPage.buttonWidget).click();
    cy.get(modalWidgetPage.modelTextField).should(
      "have.text",
      this.dataSet.ModalName,
    );
  });

  it("2. Button-CallAnApi Validation", function () {
    //creating an api and calling it from the onClickAction of the button widget.
    // Creating the api
    propPane.ClearActionField("onClick");
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("buttonApi");
    cy.log("Creation of buttonApi Action successful");
    cy.enterDatasourceAndPath(
      this.dataSet.paginationUrl,
      "mock-api?records=20&page=4&size=3",
    );
    cy.SaveAndRunAPI();

    entityExplorer.ExpandCollapseEntity("Widgets");
    entityExplorer.ExpandCollapseEntity("Container3");
    entityExplorer.SelectEntityByName("Button1");

    // Adding the api in the onClickAction of the button widget.
    cy.executeDbQuery("buttonApi", "onClick");
    // Filling the messages for success/failure in the onClickAction of the button widget.
    cy.onClickActions("Success", "Error", "Execute a query", "buttonApi.run");

    deployMode.DeployApp(
      locators._widgetInDeployed(draggableWidgets.BUTTON),
    );
    agHelper.Sleep();
    agHelper.ClickButton("Submit");
    cy.get(widgetsPage.apiCallToast).should("have.text", "Success");
  });

  it("3. Button-Call-Query Validation", function () {
    //creating a query and calling it from the onClickAction of the button widget.
    // Creating a mock query
    // cy.CreateMockQuery("Query1");
    dataSources.CreateDataSource("Postgres");
    dataSources.CreateQueryAfterDSSaved(
      `SELECT * FROM public."film" LIMIT 10;`,
    );
    entityExplorer.ExpandCollapseEntity("Container3");
    entityExplorer.SelectEntityByName("Button1");

    // Adding the query in the onClickAction of the button widget.
    cy.executeDbQuery("Query1", "onClick");
    // Filling the messages for success/failure in the onClickAction of the button widget.
    cy.onClickActions("Success", "Error", "Execute a query", "Query1.run");

    deployMode.DeployApp(publishPage.buttonWidget);

    // Clicking the button to verify the success message
    agHelper.GetNClick(publishPage.buttonWidget);
    cy.get("body").then(($ele) => {
      if ($ele.find(widgetsPage.apiCallToast).length <= 0) {
        agHelper.GetNClick(publishPage.buttonWidget);
      }
    });
    agHelper.GetNAssertElementText(widgetsPage.apiCallToast, "Success", "contain.text");
  });

  it("4. Toggle JS - Button-CallAnApi Validation", function () {
    //creating an api and calling it from the onClickAction of the button widget.
    // calling the existing api
    cy.get(widgetsPage.toggleOnClick).click({ force: true });
    propPane.UpdatePropertyFieldValue(
      "onClick",
      "{{buttonApi.run(() => showAlert('Success','success'), () => showAlert('Error','error'))}}",
    );

    deployMode.DeployApp();

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
    propPane.UpdatePropertyFieldValue(
      "onClick",
      "{{Query1.run(() => showAlert('Success','success'), () => showAlert('Error','error'))}}",
    );

    deployMode.DeployApp();

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
    propPane.UpdatePropertyFieldValue(
      "onClick",
      "{{setTimeout(() => showAlert('Hello from setTimeout after 3 seconds'), 3000)}}",
    );

    deployMode.DeployApp();

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
    deployMode.NavigateBacktoEditor();
  });
});
