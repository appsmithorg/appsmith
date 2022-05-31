import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let guid: any, dsName: any;

let agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  locator = ObjectsRegistry.CommonLocators,
  homePage = ObjectsRegistry.HomePage,
  dataSources = ObjectsRegistry.DataSources,
  deployMode = ObjectsRegistry.DeployMode,
  table = ObjectsRegistry.Table;

describe("Validate Mongo CRUD with JSON Form", () => {
  it("1. Create DS & then Add new Page and generate CRUD template using created datasource", () => {
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("MongoDB");
      guid = uid;
      agHelper.RenameWithInPane("Mongo " + guid, false);
      dataSources.FillMongoDSForm();
      dataSources.TestSaveDatasource();

      ee.AddNewPage();
      agHelper.GetNClick(homePage._buildFromDataTableActionCard);
      agHelper.GetNClick(dataSources._selectDatasourceDropdown);
      agHelper.GetNClickByContains(
        dataSources._dropdownOption,
        "Mongo " + guid,
      );
      cy.wrap("Mongo " + guid).as("dsName");
    });
    agHelper.ValidateNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
    agHelper.WaitUntilToastDisappear("datasource updated successfully");
    agHelper.GetNClick(dataSources._selectTableDropdown);
    agHelper.GetNClickByContains(dataSources._dropdownOption, "pokemon");
    GenerateCRUDNValidateDeployPage(
      "http://www.serebii.net/pokemongo/pokemon/150.png",
      "150",
      `["Bug","Ghost","Dark"]`,
      10,
    );

    agHelper.NavigateBacktoEditor();
    table.WaitUntilTableLoad();
    //Delete the test data
    ee.ActionContextMenuByEntityName("Page2", "Delete", "Are you sure?");
    agHelper.ValidateNetworkStatus("@deletePage", 200);

    //Should not be able to delete ds until app is published again
    //coz if app is published & shared then deleting ds may cause issue, So!
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      dataSources.DeleteDatasouceFromActiveTab(dsName as string, 409);
    });

    deployMode.DeployApp();
    agHelper.NavigateBacktoEditor();
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      dataSources.DeleteDatasouceFromActiveTab(dsName as string, 200);
    });
  });

  it("2. Create new app and Generate CRUD page using a new datasource", () => {
    homePage.NavigateToHome();
    homePage.CreateNewApplication();
    agHelper.GetNClick(homePage._buildFromDataTableActionCard);
    agHelper.GetNClick(dataSources._selectDatasourceDropdown);
    agHelper.GetNClickByContains(
      dataSources._dropdownOption,
      "Connect New Datasource",
    );

    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      dataSources.CreatePlugIn("MongoDB");
      guid = uid;
      agHelper.RenameWithInPane("Mongo " + guid, false);
      dataSources.FillMongoDSForm();
      dataSources.TestSaveDatasource();
      cy.wrap("Mongo " + guid).as("dsName");
    });

    agHelper.ValidateNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
    agHelper.WaitUntilToastDisappear("datasource updated successfully");
    agHelper.GetNClick(dataSources._selectTableDropdown);
    agHelper.GetNClickByContains(dataSources._dropdownOption, "friends");

    GenerateCRUDNValidateDeployPage(
      "<p>Monica's old friend Rachel moves in with her after leaving her fiancé.</p>",
      `1994-09-22`,
      "http://www.tvmaze.com/episodes/40646/friends-1x01-the-one-where-it-all-began",
      11,
    );

    agHelper.NavigateBacktoEditor();
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("3. Generate CRUD page from datasource present in ACTIVE section", function() {
    dataSources.NavigateFromActiveDS(dsName, false);
    agHelper.ValidateNetworkStatus("@getDatasourceStructure");
    agHelper.GetNClick(dataSources._selectTableDropdown);
    agHelper.GetNClickByContains(dataSources._dropdownOption, "coffeeCafe");

    GenerateCRUDNValidateDeployPage("", "", "9 of 10", 11);

    agHelper.NavigateBacktoEditor();
    table.WaitUntilTableLoad();
    //Delete the test data
    ee.expandCollapseEntity("PAGES");
    ee.ActionContextMenuByEntityName("CoffeeCafe", "Delete", "Are you sure?");
    agHelper.ValidateNetworkStatus("@deletePage", 200);
  });

  function GenerateCRUDNValidateDeployPage(
    col1Text: string,
    col2Text: string,
    col3Text: string,
    idIndex: number,
  ) {
    agHelper.GetNClick(dataSources._generatePageBtn);
    agHelper.ValidateNetworkStatus("@replaceLayoutWithCRUDPage", 201);
    agHelper.ValidateToastMessage("Successfully generated a page");
    agHelper.ValidateNetworkStatus("@getActions", 200);
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.ValidateNetworkStatus("@updateLayout", 200);

    agHelper.GetNClick(dataSources._visibleTextSpan("GOT IT"));
    deployMode.DeployApp();

    //Validating loaded table
    agHelper.AssertElementExist(dataSources._selectedRow);
    table.ReadTableRowColumnData(0, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq(col1Text);
    });
    table.ReadTableRowColumnData(0, 3, 200).then(($cellData) => {
      expect($cellData).to.eq(col2Text);
    });
    table.ReadTableRowColumnData(0, 6, 200).then(($cellData) => {
      expect($cellData).to.eq(col3Text);
    });

    //Validating loaded JSON form
    cy.xpath(locator._spanButton("Update")).then((selector) => {
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
