import {
  agHelper,
  locators,
  deployMode,
  entityExplorer,
  propPane,
  draggableWidgets,
  homePage,
  assertHelper,
  apiPage,
  dataSources,
} from "../../../../../support/Objects/ObjectsCore";

describe("Button Widget Functionality", function () {
  before(() => {
    agHelper.AddDsl("newFormDsl");
  });

  beforeEach(() => {
    entityExplorer.SelectEntityByName("Button1", "Container3");
  });

  it("1. Button-Modal Validation", function () {
    //creating the Modal and verify Modal name
    propPane.CreateModal(this.dataSet.ModalName, "onClick");
    entityExplorer.SelectEntityInModal("Modal1", "Widgets");
    propPane.TypeTextIntoField("Text", this.dataSet.ModalName);
    deployMode.DeployApp();
    agHelper.Sleep(5000); //for page to load fully - for CI exclusively
    agHelper.AssertElementVisible(
      locators._widgetInDeployed(draggableWidgets.BUTTON),
    );
    agHelper.GetNClick(locators._widgetInDeployed(draggableWidgets.BUTTON));
    agHelper.GetNAssertElementText(
      `${locators._modal}  ${locators._widgetInDeployed(
        draggableWidgets.TEXT,
      )}`,
      this.dataSet.ModalName,
    );
  });

  it("2. Button-CallAnApi Validation", function () {
    //creating an api and calling it from the onClickAction of the button widget.
    // Creating the api
    ///agHelper.GetNClick(locators._backToEditor);
    entityExplorer.SelectEntityByName("Button1", "Container3");
    propPane.ClearActionField("onClick");
    agHelper.GetElement(apiPage._addEntityApi).last().click({ force: true });
    dataSources.NavigateToDSCreateNew();
    agHelper.AssertElementAbsence(locators._loading);

    apiPage.CreateApi("buttonApi");
    cy.log("Creation of buttonApi Action successful");
    // Check this dataSources.NavigateToDSCreateNew
    agHelper.TypeTextWithoutWait(
      ".t--dataSourceField",
      `${this.dataSet.paginationUrl}mock-api?records=20&page=4&size=3`,
    );

    agHelper.AssertAutoSave();
    apiPage.RunAPI(false);

    // Going to HomePage where the button widget is located and opening it's property pane.
    entityExplorer.ExpandCollapseEntity("Widgets");
    entityExplorer.ExpandCollapseEntity("Container3");
    entityExplorer.SelectEntityByName("Button1");

    // Adding the api in the onClickAction of the button widget.
    propPane.SelectPlatformFunction("onClick", "Execute a query");
    agHelper.GetNClick(locators._dropDownValue("buttonApi"), 0, true);

    // Filling the messages for success/failure in the onClickAction of the button widget.
    propPane.onClickActions(
      "Success",
      "Error",
      "Execute a query",
      "buttonApi.run",
    );

    deployMode.DeployApp();
    agHelper.Sleep(3000);
    agHelper.GetElement("body").then(($ele) => {
      if ($ele.find(apiPage._apiCallToast).length <= 0) {
        agHelper.GetNClick(locators._widgetInDeployed(draggableWidgets.BUTTON));
      }
    });

    // Clicking the button to verify the success message
    agHelper.GetNClick(locators._widgetInDeployed(draggableWidgets.BUTTON));
    agHelper.GetElement("body").then(($ele) => {
      if ($ele.find(apiPage._apiCallToast).length <= 0) {
        agHelper.GetNClick(locators._widgetInDeployed(draggableWidgets.BUTTON));
      }
    });

    agHelper.GetNAssertElementText(apiPage._apiCallToast, "Success");
  });

  it("3. Button-Call-Query Validation", function () {
    //creating a query and calling it from the onClickAction of the button widget.
    // Creating a mock query
    dataSources.CreateDataSource("Postgres", true, false);
    entityExplorer.ActionTemplateMenuByEntityName("public.film", "SELECT");
    // Going to HomePage where the button widget is located and opeing it's property pane.
    entityExplorer.ExpandCollapseEntity("Container3");
    entityExplorer.SelectEntityByName("Button1");

    // Adding the query in the onClickAction of the button widget.
    propPane.SelectPlatformFunction("onClick", "Execute a query");
    agHelper.GetNClick(locators._dropDownValue("Query1"), 0, true);
    // Filling the messages for success/failure in the onClickAction of the button widget.
    propPane.onClickActions(
      "Success",
      "Error",
      "Execute a query",
      "Query1.run",
    );

    deployMode.DeployApp();

    // Clicking the button to verify the success message
    agHelper.GetNClick(locators._widgetInDeployed(draggableWidgets.BUTTON));
    agHelper.GetElement("body").then(($ele) => {
      if ($ele.find(apiPage._apiCallToast).length <= 0) {
        agHelper.GetNClick(locators._widgetInDeployed(draggableWidgets.BUTTON));
      }
    });
    agHelper.GetNAssertElementText(apiPage._apiCallToast, "Success");
  });

  it("4. Toggle JS - Button-CallAnApi Validation", function () {
    //creating an api and calling it from the onClickAction of the button widget.
    // calling the existing api
    agHelper.GetNClick(locators._jsToggle("onclick"), 0, true);
    propPane.UpdatePropertyFieldValue(
      "onClick",
      "{{buttonApi.run(() => showAlert('Success','success'), () => showAlert('Error','error'))}}",
    );

    deployMode.DeployApp();

    // Clicking the button to verify the success message
    agHelper.GetNClick(locators._widgetInDeployed(draggableWidgets.BUTTON));
    agHelper.GetElement("body").then(($ele) => {
      if ($ele.find(apiPage._apiCallToast).length <= 0) {
        agHelper.GetNClick(locators._widgetInDeployed(draggableWidgets.BUTTON));
      }
    });
    agHelper.GetNAssertElementText(apiPage._apiCallToast, "Success");
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
    agHelper.GetNClick(locators._widgetInDeployed(draggableWidgets.BUTTON));
    agHelper.GetElement("body").then(($ele) => {
      if ($ele.find(apiPage._apiCallToast).length <= 0) {
        agHelper.GetNClick(locators._widgetInDeployed(draggableWidgets.BUTTON));
        agHelper.Sleep(3000);
      }
    });
    agHelper.GetNAssertElementText(apiPage._apiCallToast, "Success");
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
    agHelper.GetNClick(locators._widgetInDeployed(draggableWidgets.BUTTON));
    agHelper.Sleep(3000);
    agHelper.GetElement("body").then(($ele) => {
      if ($ele.find(apiPage._apiCallToast).length <= 0) {
        agHelper.GetNClick(locators._widgetInDeployed(draggableWidgets.BUTTON));
        agHelper.Sleep(3000);
      }
    });
    agHelper.GetNAssertElementText(
      apiPage._apiCallToast,
      "Hello from setTimeout after 3 seconds",
    );
  });

  afterEach(() => {
    deployMode.NavigateBacktoEditor();
  });
});
