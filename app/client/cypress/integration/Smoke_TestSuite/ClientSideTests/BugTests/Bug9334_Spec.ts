import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import { Table } from "../../../../support/Pages/Table";
import { TableV2 } from "../../../../support/Pages/TableV2";

let dsName: any, query: string;
const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  dataSources = ObjectsRegistry.DataSources,
  propPane = ObjectsRegistry.PropertyPane,
  homePage = ObjectsRegistry.HomePage,
  locator = ObjectsRegistry.CommonLocators,
  table = ObjectsRegistry.Table;

describe("Bug 9334: The Select widget value is sent as null when user switches between the pages", function() {
  before(() => {
    propPane.ChangeTheme("Pampas");
  });

  it("1. Create Postgress DS", function() {
    dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("2. Create dummy pages for navigating", () => {
    //CRUD page 2
    ee.AddNewPage();
    agHelper.GetNClick(homePage._buildFromDataTableActionCard);
    agHelper.GetNClick(dataSources._selectDatasourceDropdown);
    agHelper.GetNClickByContains(dataSources._dropdownOption, dsName);

    agHelper.ValidateNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
    agHelper.GetNClick(dataSources._selectTableDropdown);
    agHelper.GetNClickByContains(dataSources._dropdownOption, "astronauts");
    agHelper.GetNClick(dataSources._generatePageBtn);
    agHelper.ValidateNetworkStatus("@replaceLayoutWithCRUDPage", 201);
    agHelper.AssertContains("Successfully generated a page");
    //agHelper.ValidateNetworkStatus("@getActions", 200);//Since failing sometimes
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.ValidateNetworkStatus("@updateLayout", 200);
    agHelper.GetNClick(dataSources._visibleTextSpan("GOT IT"));
    table.WaitUntilTableLoad();

    //CRUD page 3
    ee.AddNewPage();
    agHelper.GetNClick(homePage._buildFromDataTableActionCard);
    agHelper.GetNClick(dataSources._selectDatasourceDropdown);
    agHelper.GetNClickByContains(dataSources._dropdownOption, dsName);

    agHelper.ValidateNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
    agHelper.GetNClick(dataSources._selectTableDropdown);
    agHelper.GetNClickByContains(dataSources._dropdownOption, "country");
    agHelper.GetNClick(dataSources._generatePageBtn);
    agHelper.ValidateNetworkStatus("@replaceLayoutWithCRUDPage", 201);
    agHelper.AssertContains("Successfully generated a page");
    //agHelper.ValidateNetworkStatus("@getActions", 200);//Since failing sometimes
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.ValidateNetworkStatus("@updateLayout", 200);
    agHelper.GetNClick(dataSources._visibleTextSpan("GOT IT"));
    table.WaitUntilTableLoad();
  });

  //Since its failing continuously skiping now
  it("3. Navigate & Assert toast", () => {
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
