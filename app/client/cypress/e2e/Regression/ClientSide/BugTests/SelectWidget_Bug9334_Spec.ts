import {
  agHelper,
  appSettings,
  assertHelper,
  dataSources,
  locators,
  table,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  AppSidebarButton,
  AppSidebar,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

let dsName: any;

describe(
  "Bug 9334: The Select widget value is sent as null when user switches between the pages",
  { tags: ["@tag.Widget", "@tag.Binding"] },
  function () {
    before("Change Theme & Create Postgress DS", () => {
      appSettings.OpenPaneAndChangeTheme("Pampas");
      dataSources.CreateDataSource("Postgres");
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
      });
      AppSidebar.navigate(AppSidebarButton.Editor);
    });

    it("1. Create dummy pages for navigating", () => {
      //CRUD page 2
      PageList.AddNewPage();
      PageList.AddNewPage("Generate page with data");
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
      agHelper.ClickButton("Got it");
      assertHelper.AssertNetworkStatus("@updateLayout", 200);
      table.WaitUntilTableLoad(0, 0, "v2");

      //CRUD page 3
      PageList.AddNewPage();
      PageList.AddNewPage("Generate page with data");
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
      agHelper.ClickButton("Got it");
      assertHelper.AssertNetworkStatus("@updateLayout", 200);
      table.WaitUntilTableLoad(0, 0, "v2");
    });

    it("2. Navigate & Assert toast", () => {
      //Navigating between CRUD (Page3) & EmptyPage (Page2):
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      agHelper.Sleep(2000);
      EditorNavigation.SelectEntityByName("Page2", EntityType.Page);
      agHelper.AssertElementAbsence(
        locators._specificToast('The action "SelectQuery" has failed.'),
      );

      //Navigating between CRUD (Page3) & CRUD (Page4):
      EditorNavigation.SelectEntityByName("Page3", EntityType.Page);
      agHelper.Sleep(2000);
      EditorNavigation.SelectEntityByName("Page2", EntityType.Page);
      agHelper.AssertElementAbsence(
        locators._specificToast('The action "SelectQuery" has failed.'),
      );
    });
  },
);
