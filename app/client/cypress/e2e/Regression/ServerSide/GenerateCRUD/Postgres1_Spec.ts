import * as _ from "../../../../support/Objects/ObjectsCore";

let dsName: any;

describe("Postgres Generate CRUD with JSON Form", () => {
  it("1. Create DS & then Add new Page and generate CRUD template using created datasource", () => {
    _.dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      _.entityExplorer.AddNewPage();
      _.entityExplorer.AddNewPage("Generate page with data");
      _.agHelper.GetNClick(_.dataSources._selectDatasourceDropdown);
      _.agHelper.GetNClickByContains(_.dataSources._dropdownOption, dsName);
    });

    _.agHelper.ValidateNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
    _.agHelper.GetNClick(_.dataSources._selectTableDropdown, 0, true);
    _.agHelper.GetNClickByContains(_.dataSources._dropdownOption, "film");

    GenerateCRUDNValidateDeployPage(
      "ACADEMY DINOSAUR",
      "2006",
      "English",
      "film_id",
    );

    _.deployMode.NavigateBacktoEditor();
    _.table.WaitUntilTableLoad();
    //Delete the test data
    _.entityExplorer.ExpandCollapseEntity("Pages");
    _.entityExplorer.ActionContextMenuByEntityName(
      "Page2",
      "Delete",
      "Are you sure?",
    );
    _.agHelper.ValidateNetworkStatus("@deletePage", 200);

    //Should not be able to delete ds until app is published again
    //coz if app is published & shared then deleting ds may cause issue, So!
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      _.dataSources.DeleteDatasouceFromActiveTab(dsName as string, 409);
      _.agHelper.RefreshPage();
    });
    _.deployMode.DeployApp();
    _.deployMode.NavigateBacktoEditor();
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      _.dataSources.DeleteDatasouceFromActiveTab(dsName as string, 200);
    });
  });

  it("2. Create new app and Generate CRUD page using a new datasource", () => {
    _.homePage.NavigateToHome();
    _.homePage.CreateNewApplication();
    _.entityExplorer.AddNewPage("Generate page with data");
    //_.agHelper.GetNClick(_.homePage._buildFromDataTableActionCard);
    _.agHelper.GetNClick(_.dataSources._selectDatasourceDropdown);
    _.agHelper.GetNClickByContains(
      _.dataSources._dropdownOption,
      "Connect new datasource",
    );
    _.dataSources.CreateDataSource("Postgres", false);
    _.agHelper.ValidateNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
    _.agHelper.GetNClick(_.dataSources._selectTableDropdown, 0, true);
    _.agHelper.GetNClickByContains(_.dataSources._dropdownOption, "suppliers");

    GenerateCRUDNValidateDeployPage(
      "Exotic Liquids",
      "Purchasing Manager",
      "49 Gilbert St.",
      "supplier_id",
    );

    _.deployMode.NavigateBacktoEditor();
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
    _.appSettings.OpenPaneAndChangeTheme("Sunrise");
  });

  it("3. Generate CRUD page from datasource present in ACTIVE section", function () {
    _.dataSources.NavigateFromActiveDS(dsName, false);
    _.agHelper.ValidateNetworkStatus("@getDatasourceStructure");
    _.agHelper.GetNClick(_.dataSources._selectTableDropdown, 0, true);
    _.agHelper.GetNClickByContains(_.dataSources._dropdownOption, "orders");

    GenerateCRUDNValidateDeployPage(
      "VINET",
      "1996-07-04",
      "1996-08-01",
      "order_id",
    );

    _.deployMode.NavigateBacktoEditor();
    _.table.WaitUntilTableLoad();
    //Delete the test data
    _.entityExplorer.ExpandCollapseEntity("Pages");
    _.entityExplorer.ActionContextMenuByEntityName(
      "Public.orders",
      "Delete",
      "Are you sure?",
    );
    _.agHelper.ValidateNetworkStatus("@deletePage", 200);
  });

  it("4. Verify Deletion of the datasource when Pages/Actions associated are not removed yet", () => {
    _.deployMode.DeployApp();
    _.deployMode.NavigateBacktoEditor();
    _.dataSources.DeleteDatasouceFromWinthinDS(dsName, 409); //Suppliers Page - 1 still using this ds
  });

  function GenerateCRUDNValidateDeployPage(
    col1Text: string,
    col2Text: string,
    col3Text: string,
    jsonFromHeader: string,
  ) {
    _.agHelper.GetNClick(_.dataSources._generatePageBtn);
    _.agHelper.ValidateNetworkStatus("@replaceLayoutWithCRUDPage", 201);
    _.agHelper.AssertContains("Successfully generated a page");
    //_.agHelper.ValidateNetworkStatus("@getActions", 200);//Since failing sometimes
    _.agHelper.ValidateNetworkStatus("@postExecute", 200);
    _.agHelper.GetNClick(_.dataSources._visibleTextSpan("Got it"));
    _.agHelper.ValidateNetworkStatus("@updateLayout", 200);
    _.deployMode.DeployApp();

    //Validating loaded table
    _.agHelper.AssertElementExist(_.dataSources._selectedRow);
    _.table.ReadTableRowColumnData(0, 1, "v1", 4000).then(($cellData) => {
      expect($cellData).to.eq(col1Text);
    });
    _.table.ReadTableRowColumnData(0, 3, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq(col2Text);
    });
    _.table.ReadTableRowColumnData(0, 4, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq(col3Text);
    });

    //Validating loaded JSON form
    cy.xpath(_.locators._spanButton("Update")).then((selector) => {
      cy.wrap(selector)
        .invoke("attr", "class")
        .then((classes) => {
          //cy.log("classes are:" + classes);
          expect(classes).not.contain("bp3-disabled");
        });
    });
    _.dataSources.AssertJSONFormHeader(0, 0, jsonFromHeader);
  }
});
