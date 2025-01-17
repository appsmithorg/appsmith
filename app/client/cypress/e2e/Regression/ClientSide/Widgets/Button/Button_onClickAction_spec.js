import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const widgetsPage = require("../../../../../locators/Widgets.json");
const publishPage = require("../../../../../locators/publishWidgetspage.json");
const modalWidgetPage = require("../../../../../locators/ModalWidget.json");
import {
  agHelper,
  dataSources,
  deployMode,
  draggableWidgets,
  locators,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  "Button Widget Functionality",
  { tags: ["@tag.All", "@tag.Button", "@tag.Sanity", "@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("newFormDsl");
    });

    beforeEach(() => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget, {}, [
        "Container3",
      ]);
    });

    it("1. Button-Modal Validation", function () {
      //creating the Modal and verify Modal name
      cy.createModal(this.dataSet.ModalName, "onClick");
      deployMode.DeployApp();
      cy.wait(2500); //for page to load fully - for CI exclusively
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
      cy.CreateAPI("buttonApi");
      cy.log("Creation of buttonApi Action successful");
      cy.enterDatasourceAndPath(
        this.dataSet.paginationUrl,
        "mock-api?records=20&page=4&size=3",
      );
      cy.SaveAndRunAPI();

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget, {}, [
        "Container3",
      ]);

      // Adding the api in the onClickAction of the button widget.
      cy.executeDbQuery("buttonApi", "onClick");
      // Filling the messages for success/failure in the onClickAction of the button widget.
      cy.onClickActions(
        "Success buttonApi run",
        "Error",
        "Execute a query",
        "buttonApi.run",
      );
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.BUTTON));
      agHelper.Sleep();
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Success buttonApi run");
    });

    it("3. Button-Call-Query Validation", function () {
      //creating a query and calling it from the onClickAction of the button widget.
      // Creating a mock query
      dataSources.CreateDataSource("Postgres");
      dataSources.CreateQueryAfterDSSaved();
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget, {}, [
        "Container3",
      ]);

      // Delete the buttonApi action
      agHelper.GetNClick(propPane._actionCardByTitle("Execute a query"));
      agHelper.GetNClick(propPane._actionSelectorDelete);

      // Adding the query in the onClickAction of the button widget.
      cy.executeDbQuery("Query1", "onClick");
      // Filling the messages for success/failure in the onClickAction of the button widget.
      cy.onClickActions(
        "Success postgres query run",
        "Error",
        "Execute a query",
        "Query1.run",
      );

      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.BUTTON));
      agHelper.Sleep();

      // Clicking the button to verify the success message
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Success postgres query run");
    });

    it("4. Toggle JS - Button-CallAnApi - JS mode", function () {
      //creating an api and calling it from the onClickAction of the button widget.
      // calling the existing api
      cy.get(widgetsPage.toggleOnClick).click({ force: true });
      propPane.UpdatePropertyFieldValue(
        "onClick",
        "{{buttonApi.run(() => showAlert('Success buttonapi run','success'), () => showAlert('Error','error'))}}",
      );

      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.BUTTON));
      agHelper.Sleep();
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Success buttonapi run");
    });

    it("5. Toggle JS - Button-Call-Query - JS mode", function () {
      //creating a query and calling it from the onClickAction of the button widget.
      // Creating a mock query
      propPane.UpdatePropertyFieldValue(
        "onClick",
        "{{Query1.run(() => showAlert('Success postgres query run','success'), () => showAlert('Error','error'))}}",
      );
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.BUTTON));
      agHelper.Sleep();
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Success postgres query run");
    });

    it("6. Toggle JS - Button-Call-SetTimeout Validation", function () {
      //creating a query and calling it from the onClickAction of the button widget.
      // Creating a mock query
      propPane.UpdatePropertyFieldValue(
        "onClick",
        "{{setTimeout(() => showAlert('Hello from setTimeout after 3 seconds'), 3000)}}",
      );

      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.BUTTON));
      agHelper.Sleep();

      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Hello from setTimeout after 3 seconds");
    });

    afterEach(() => {
      deployMode.NavigateBacktoEditor();
    });
  },
);
