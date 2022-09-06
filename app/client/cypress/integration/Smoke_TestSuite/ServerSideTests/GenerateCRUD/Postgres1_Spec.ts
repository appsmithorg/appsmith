import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let dsName: any;

const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  locator = ObjectsRegistry.CommonLocators,
  table = ObjectsRegistry.Table,
  homePage = ObjectsRegistry.HomePage,
  dataSources = ObjectsRegistry.DataSources,
  propPane = ObjectsRegistry.PropertyPane,
  deployMode = ObjectsRegistry.DeployMode;

describe("Validate Postgres Generate CRUD with JSON Form", () => {
  it("1. Create DS & then Add new Page and generate CRUD template using created datasource", () => {
    dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      ee.AddNewPage();
      agHelper.GetNClick(homePage._buildFromDataTableActionCard);
      agHelper.GetNClick(dataSources._selectDatasourceDropdown);
      agHelper.GetNClickByContains(dataSources._dropdownOption, dsName);
    });

    agHelper.ValidateNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
    agHelper.GetNClick(dataSources._selectTableDropdown);
    agHelper.GetNClickByContains(dataSources._dropdownOption, "film");

    GenerateCRUDNValidateDeployPage(
      "ACADEMY DINOSAUR",
      "2006",
      "English",
      "film_id",
    );

    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad();
    //Delete the test data
    ee.ExpandCollapseEntity("Pages");
    ee.ActionContextMenuByEntityName("Page2", "Delete", "Are you sure?");
    agHelper.ValidateNetworkStatus("@deletePage", 200);

    //Should not be able to delete ds until app is published again
    //coz if app is published & shared then deleting ds may cause issue, So!
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      dataSources.DeleteDatasouceFromActiveTab(dsName as string, 409);
      agHelper.RefreshPage();
      deployMode.DeployApp();
      deployMode.NavigateBacktoEditor();
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
    dataSources.CreateDataSource("Postgres", false);
    agHelper.ValidateNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
    agHelper.GetNClick(dataSources._selectTableDropdown);
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
    propPane.ChangeTheme("Sunrise");
  });

  it("3. Generate CRUD page from datasource present in ACTIVE section", function() {
    dataSources.NavigateFromActiveDS(dsName, false);
    agHelper.ValidateNetworkStatus("@getDatasourceStructure");
    agHelper.GetNClick(dataSources._selectTableDropdown);
    agHelper.GetNClickByContains(dataSources._dropdownOption, "orders");

    GenerateCRUDNValidateDeployPage(
      "VINET",
      "1996-07-04",
      "1996-08-01",
      "order_id",
    );

    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad();
    //Delete the test data
    ee.ExpandCollapseEntity("Pages");
    ee.ActionContextMenuByEntityName(
      "Public.orders",
      "Delete",
      "Are you sure?",
    );
    agHelper.ValidateNetworkStatus("@deletePage", 200);
  });

  it("4. Verify Deletion of the datasource when Pages/Actions associated are not removed yet", () => {
    deployMode.DeployApp();
    deployMode.NavigateBacktoEditor();
    dataSources.DeleteDatasouceFromWinthinDS(dsName, 409); //Suppliers Page - 1 still using this ds
  });

  function GenerateCRUDNValidateDeployPage(
    col1Text: string,
    col2Text: string,
    col3Text: string,
    jsonFromHeader: string,
  ) {
    agHelper.GetNClick(dataSources._generatePageBtn);
    agHelper.ValidateNetworkStatus("@replaceLayoutWithCRUDPage", 201);
    agHelper.AssertContains("Successfully generated a page");
    //agHelper.ValidateNetworkStatus("@getActions", 200);//Since failing sometimes
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.ValidateNetworkStatus("@updateLayout", 200);

    agHelper.GetNClick(dataSources._visibleTextSpan("GOT IT"));
    deployMode.DeployApp();

    //Validating loaded table
    agHelper.AssertElementExist(dataSources._selectedRow);
    table.ReadTableRowColumnData(0, 1, 4000).then(($cellData) => {
      expect($cellData).to.eq(col1Text);
    });
    table.ReadTableRowColumnData(0, 3, 200).then(($cellData) => {
      expect($cellData).to.eq(col2Text);
    });
    table.ReadTableRowColumnData(0, 4, 200).then(($cellData) => {
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
    dataSources.AssertJSONFormHeader(0, 0, jsonFromHeader);
  }
});
