import { INTERCEPT } from "../../../../fixtures/variables";

import {
  agHelper,
  appSettings,
  assertHelper,
  dataSources,
  deployMode,
  entityExplorer,
  entityItems,
  locators,
  table,
} from "../../../../support/Objects/ObjectsCore";
import PageList from "../../../../support/Pages/PageList";
import { PageLeftPane } from "../../../../support/Pages/EditorNavigation";

describe("Validate Mongo CRUD with JSON Form", () => {
  let dsName: any;

  beforeEach(function () {
    if (INTERCEPT.MONGO) {
      cy.log("Mongo DB is not found. Using intercept");
      dataSources.StartInterceptRoutesForMongo();
    } else cy.log("Mongo DB is found, hence using actual DB");
  });

  it("1. Create DS & then Add new Page and generate CRUD template using created datasource", () => {
    appSettings.OpenPaneAndChangeTheme("Water Lily");

    dataSources.CreateDataSource("Mongo", true, false);
    cy.get("@dsName").then(($dsName: any) => {
      dsName = $dsName;
      PageList.AddNewPage();
      PageList.AddNewPage("Generate page with data");
      agHelper.GetNClick(dataSources._selectDatasourceDropdown);
      agHelper.GetNClickByContains(dataSources._dropdownOption, dsName);
    });
    assertHelper.AssertNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
    agHelper.GetNClick(dataSources._selectTableDropdown, 0, true);
    agHelper.GetNClickByContains(dataSources._dropdownOption, "pokemon");
    GenerateCRUDNValidateDeployPage(
      "http://www.serebii.net/pokemongo/pokemon/150.png",
      "150",
      `["Bug","Ghost","Dark"]`,
      10,
    );

    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad();

    //Delete the test data
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
    });

    // deployMode.DeployApp();
    // agHelper.NavigateBacktoEditor();
  });

  it("2. Generate CRUD page from datasource present in ACTIVE section", function () {
    dataSources.GeneratePageForDS(dsName);
    agHelper.GetNClick(dataSources._selectTableDropdown, 0, true);
    agHelper.GetNClickByContains(dataSources._dropdownOption, "coffeeCafe");
    GenerateCRUDNValidateDeployPage("", "", "Washington, US", 11);
    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad(1, 0);
    //Delete the test data
    PageLeftPane.expandCollapseItem("Pages");
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "CoffeeCafe",
      action: "Delete",
      entityType: entityItems.Page,
    });
    deployMode.DeployApp();
    deployMode.NavigateBacktoEditor();
    dataSources.DeleteDatasourceFromWithinDS(dsName as string, 200);
  });

  //Update, delete, Add goes here

  function GenerateCRUDNValidateDeployPage(
    col1Text: string,
    col2Text: string,
    col3Text: string,
    idIndex: number,
  ) {
    agHelper.GetNClick(dataSources._generatePageBtn);
    assertHelper.AssertNetworkStatus("@replaceLayoutWithCRUDPage", 201);
    agHelper.AssertContains("Successfully generated a page"); // Commenting this since FindQuery failure appears sometimes
    assertHelper.AssertNetworkStatus("@getActions", 200);
    assertHelper.AssertNetworkStatus("@postExecute", 200);
    agHelper.ClickButton("Got it");
    assertHelper.AssertNetworkStatus("@updateLayout", 200);
    deployMode.DeployApp(locators._widgetInDeployed("tablewidget"));

    //Validating loaded table
    agHelper.AssertElementExist(dataSources._selectedRow);
    table.ReadTableRowColumnData(0, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq(col1Text);
    });
    table.ReadTableRowColumnData(0, 3, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq(col2Text);
    });
    table.ReadTableRowColumnData(0, 6, "v1", 200).then(($cellData) => {
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
    dataSources.AssertJSONFormHeader(0, idIndex, "Id", "", true);
  }
});
