import {
  agHelper,
  appSettings,
  assertHelper,
  dataSources,
  deployMode,
  draggableWidgets,
  entityExplorer,
  entityItems,
  homePage,
  locators,
  table,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  AppSidebar,
  AppSidebarButton,
  EntityType,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

let dsName: any;

describe(
  "Postgres Generate CRUD with JSON Form",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  () => {
    it("1. Create DS & then Add new Page and generate CRUD template using created datasource", () => {
      dataSources.CreateDataSource("Postgres");
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
        AppSidebar.navigate(AppSidebarButton.Editor);
        PageList.AddNewPage();
        PageList.AddNewPage("Generate page with data");
        agHelper.GetNClick(dataSources._selectDatasourceDropdown);
        agHelper.GetNClickByContains(dataSources._dropdownOption, dsName);
      });

      assertHelper.AssertNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
      agHelper.GetNClick(dataSources._selectTableDropdown, 0, true);
      agHelper.GetNClickByContains(dataSources._dropdownOption, "film");

      GenerateCRUDNValidateDeployPage(
        "ACADEMY DINOSAUR",
        "2006",
        "English",
        "film_id",
      );

      deployMode.NavigateBacktoEditor();
      table.WaitUntilTableLoad(0, 0, "v2");
      //Delete the test data
      PageList.ShowList();
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Page2",
        action: "Delete",
        entityType: entityItems.Page,
      });

      //Should not be able to delete ds until app is published again
      //coz if app is published & shared then deleting ds may cause issue, So!
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
        dataSources.DeleteDatasourceFromWithinDS(dsName as string, 409);
        agHelper.WaitUntilAllToastsDisappear();
      });
      deployMode.DeployApp(locators._emptyPageTxt);
      agHelper.Sleep(3000);
      deployMode.NavigateBacktoEditor();
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
        dataSources.DeleteDatasourceFromWithinDS(dsName as string, 200);
      });
    });

    it("2. Create new app and Generate CRUD page using a new datasource", () => {
      homePage.NavigateToHome();
      homePage.CreateNewApplication();
      PageList.AddNewPage("Generate page with data");
      //agHelper.GetNClick(homePage._buildFromDataTableActionCard);
      agHelper.GetNClick(dataSources._selectDatasourceDropdown);
      agHelper.GetNClickByContains(
        dataSources._dropdownOption,
        "Connect new datasource",
      );
      dataSources.CreateDataSource("Postgres", false);
      assertHelper.AssertNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
      agHelper.GetNClick(dataSources._selectTableDropdown, 0, true);
      agHelper.GetNClickByContains(dataSources._dropdownOption, "suppliers");

      GenerateCRUDNValidateDeployPage(
        "Exotic Liquids",
        "Purchasing Manager",
        "49 Gilbert St.",
        "supplier_id",
      );

      deployMode.NavigateBacktoEditor();
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
      });
      appSettings.OpenPaneAndChangeTheme("Sunrise");
    });

    it("3. Generate CRUD page from datasource present in ACTIVE section", function () {
      EditorNavigation.SelectEntityByName(dsName, EntityType.Datasource);
      dataSources.SelectTableFromPreviewSchemaList("public.orders");

      GenerateCRUDNValidateDeployPage(
        "VINET",
        "1996-07-04T00:00:00+00:00",
        "1996-08-01T00:00:00+00:00",
        "order_id",
      );

      deployMode.NavigateBacktoEditor();
      table.WaitUntilTableLoad(0, 0, "v2");
      //Delete the test data
      PageList.ShowList();
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Public.orders",
        action: "Delete",
        entityType: entityItems.Page,
      });
    });

    it("4. Verify Deletion of the datasource when Pages/Actions associated are not removed yet", () => {
      deployMode.DeployApp();
      deployMode.NavigateBacktoEditor();
      dataSources.DeleteDatasourceFromWithinDS(dsName, 409); //Suppliers Page - 1 still using this ds
    });

    function GenerateCRUDNValidateDeployPage(
      col1Text: string,
      col2Text: string,
      col3Text: string,
      jsonFromHeader: string,
    ) {
      agHelper.GetNClick(
        `${dataSources._generatePageBtn}, ${dataSources._datasourceCardGeneratePageBtn}`,
      );
      assertHelper.AssertNetworkStatus("@replaceLayoutWithCRUDPage", 201);
      agHelper.AssertContains("Successfully generated a page");
      //assertHelper.AssertNetworkStatus("@getActions", 200);//Since failing sometimes
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      agHelper.ClickButton("Got it");
      assertHelper.AssertNetworkStatus("@updateLayout", 200);
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TABLE));

      //Validating loaded table
      agHelper.AssertElementExist(dataSources._selectedRow);
      table.ReadTableRowColumnData(0, 1, "v2", 4000).then(($cellData) => {
        expect($cellData).to.eq(col1Text);
      });
      table.ReadTableRowColumnData(0, 3, "v2", 200).then(($cellData) => {
        expect($cellData).to.eq(col2Text);
      });
      table.ReadTableRowColumnData(0, 4, "v2", 200).then(($cellData) => {
        expect($cellData).to.eq(col3Text);
      });

      //Validating loaded JSON form
      cy.xpath(locators._buttonByText("Update")).then((selector) => {
        cy.wrap(selector)
          .invoke("attr", "class")
          .then((classes) => {
            //cy.log("classes are:" + classes);
            expect(classes).not.contain("bp3-disabled");
          });
      });
      dataSources.AssertJSONFormHeader(0, 0, jsonFromHeader);
    }
  },
);
