import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let dsName: any;
const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  dataSources = ObjectsRegistry.DataSources,
  locator = ObjectsRegistry.CommonLocators,
  table = ObjectsRegistry.Table,
  appSettings = ObjectsRegistry.AppSettings;

describe("Bug 9334: The Select widget value is sent as null when user switches between the pages", function () {
  before("Change Theme & Create Postgress DS", () => {
    appSettings.OpenPaneAndChangeTheme("Pampas");
    dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("1. Create dummy pages for navigating", () => {
    //CRUD page 2
    ee.AddNewPage();
    ee.AddNewPage("Generate page with data");
    agHelper.GetNClick(dataSources._selectDatasourceDropdown);
    agHelper.GetNClickByContains(dataSources._dropdownOption, dsName);

    agHelper.AssertNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
    agHelper.GetNClick(dataSources._selectTableDropdown, 0, true);
    agHelper.GetNClickByContains(dataSources._dropdownOption, "astronauts");
    agHelper.GetNClick(dataSources._generatePageBtn);
    agHelper.AssertNetworkStatus("@replaceLayoutWithCRUDPage", 201);
    agHelper.AssertContains("Successfully generated a page");
    //agHelper.AssertNetworkStatus("@getActions", 200);//Since failing sometimes
    agHelper.AssertNetworkStatus("@postExecute", 200);
    agHelper.GetNClick(dataSources._visibleTextSpan("Got it"));
    agHelper.AssertNetworkStatus("@updateLayout", 200);
    table.WaitUntilTableLoad();

    //CRUD page 3
    ee.AddNewPage();
    ee.AddNewPage("Generate page with data");
    agHelper.GetNClick(dataSources._selectDatasourceDropdown);
    agHelper.GetNClickByContains(dataSources._dropdownOption, dsName);

    agHelper.AssertNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
    agHelper.GetNClick(dataSources._selectTableDropdown, 0, true);
    agHelper.GetNClickByContains(dataSources._dropdownOption, "country");
    agHelper.GetNClick(dataSources._generatePageBtn);
    agHelper.AssertNetworkStatus("@replaceLayoutWithCRUDPage", 201);
    agHelper.AssertContains("Successfully generated a page");
    //agHelper.AssertNetworkStatus("@getActions", 200);//Since failing sometimes
    agHelper.AssertNetworkStatus("@postExecute", 200);
    agHelper.GetNClick(dataSources._visibleTextSpan("Got it"));
    agHelper.AssertNetworkStatus("@updateLayout", 200);
    table.WaitUntilTableLoad();
  });
  it("2. Navigate & Assert toast", () => {
    //Navigating between CRUD (Page3) & EmptyPage (Page2):
    ee.SelectEntityByName("Page1");
    agHelper.Sleep(2000);
    ee.SelectEntityByName("Page2");
    agHelper.AssertElementAbsence(
      locator._specificToast('The action "SelectQuery" has failed.'),
    );

    //Navigating between CRUD (Page3) & CRUD (Page4):
    ee.SelectEntityByName("Page3");
    agHelper.Sleep(2000);
    ee.SelectEntityByName("Page2");
    agHelper.AssertElementAbsence(
      locator._specificToast('The action "SelectQuery" has failed.'),
    );
  });
});
