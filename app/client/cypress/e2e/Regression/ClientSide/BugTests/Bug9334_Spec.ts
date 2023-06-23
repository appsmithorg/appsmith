import {
  assertHelper,
  agHelper,
  dataSources,
  locators,
  table,
  appSettings,
  entityExplorer,
} from "../../../../support/Objects/ObjectsCore";

let dsName: any;

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
    entityExplorer.AddNewPage();
    entityExplorer.AddNewPage("Generate page with data");
    agHelper.GetNClick(dataSources._selectDatasourceDropdown);
    agHelper.GetNClickByContains(dataSources._dropdownOption, dsName);

    assertHelper.AssertNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
    agHelper.GetNClick(dataSources._selectTableDropdown, 0, true);
    agHelper.GetNClickByContains(dataSources._dropdownOption, "astronauts");
    agHelper.GetNClick(dataSources._generatePageBtn);
    assertHelper.AssertNetworkStatus("@replaceLayoutWithCRUDPage", 201);
    agHelper.AssertContains("Successfully generated a page");
    //assertHelper.AssertNetworkStatus("@getActions", 200);//Since failing sometimes
    assertHelper.AssertNetworkStatus("@postExecute", 200);
    agHelper.GetNClick(dataSources._visibleTextSpan("Got it"));
    assertHelper.AssertNetworkStatus("@updateLayout", 200);
    table.WaitUntilTableLoad();

    //CRUD page 3
    entityExplorer.AddNewPage();
    entityExplorer.AddNewPage("Generate page with data");
    agHelper.GetNClick(dataSources._selectDatasourceDropdown);
    agHelper.GetNClickByContains(dataSources._dropdownOption, dsName);

    assertHelper.AssertNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
    agHelper.GetNClick(dataSources._selectTableDropdown, 0, true);
    agHelper.GetNClickByContains(dataSources._dropdownOption, "country");
    agHelper.GetNClick(dataSources._generatePageBtn);
    assertHelper.AssertNetworkStatus("@replaceLayoutWithCRUDPage", 201);
    agHelper.AssertContains("Successfully generated a page");
    //assertHelper.AssertNetworkStatus("@getActions", 200);//Since failing sometimes
    assertHelper.AssertNetworkStatus("@postExecute", 200);
    agHelper.GetNClick(dataSources._visibleTextSpan("Got it"));
    assertHelper.AssertNetworkStatus("@updateLayout", 200);
    table.WaitUntilTableLoad();
  });
  it("2. Navigate & Assert toast", () => {
    //Navigating between CRUD (Page3) & EmptyPage (Page2):
    entityExplorer.SelectEntityByName("Page1");
    agHelper.Sleep(2000);
    entityExplorer.SelectEntityByName("Page2");
    agHelper.AssertElementAbsence(
      locators._specificToast('The action "SelectQuery" has failed.'),
    );

    //Navigating between CRUD (Page3) & CRUD (Page4):
    entityExplorer.SelectEntityByName("Page3");
    agHelper.Sleep(2000);
    entityExplorer.SelectEntityByName("Page2");
    agHelper.AssertElementAbsence(
      locators._specificToast('The action "SelectQuery" has failed.'),
    );
  });
});
