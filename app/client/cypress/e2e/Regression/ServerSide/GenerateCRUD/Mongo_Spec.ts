import { INTERCEPT } from "../../../../fixtures/variables";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let dsName: any;

const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  locator = ObjectsRegistry.CommonLocators,
  dataSources = ObjectsRegistry.DataSources,
  deployMode = ObjectsRegistry.DeployMode,
  table = ObjectsRegistry.Table,
  appSettings = ObjectsRegistry.AppSettings;

describe("Validate Mongo CRUD with JSON Form", () => {
  before(() => {
    //dataSources.StartDataSourceRoutes(); //already started in index.js beforeeach
  });

  beforeEach(function () {
    if (INTERCEPT.MONGO) {
      cy.log("Mongo DB is not found. Using intercept");
      dataSources.StartInterceptRoutesForMongo();
    } else cy.log("Mongo DB is found, hence using actual DB");
  });

  it("1. Create DS & then Add new Page and generate CRUD template using created datasource", () => {
    appSettings.OpenPaneAndChangeTheme("Water Lily");

    dataSources.CreateDataSource("Mongo");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      ee.AddNewPage();
      ee.AddNewPage("Generate page with data");
      agHelper.GetNClick(dataSources._selectDatasourceDropdown);
      agHelper.GetNClickByContains(dataSources._dropdownOption, dsName);
    });
    agHelper.ValidateNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
    agHelper.GetNClick(dataSources._selectTableDropdown, 0, true);
    agHelper.GetNClickByContains(dataSources._dropdownOption, "pokemon");
    GenerateCRUDNValidateDeployPage(
      "58f56171ee9d4bd5e610d6d9",
      "None",
      `["Psychic"]`,
      0,
    );

    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad(0, 0, "v2");

    //Delete the test data
    ee.ActionContextMenuByEntityName("Page2", "Delete", "Are you sure?");
    agHelper.ValidateNetworkStatus("@deletePage", 200);

    //Should not be able to delete ds until app is published again
    //coz if app is published & shared then deleting ds may cause issue, So!
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      dataSources.DeleteDatasouceFromActiveTab(dsName as string, 409);
    });

    // deployMode.DeployApp();
    // agHelper.NavigateBacktoEditor();
  });

  it("2. Generate CRUD page from datasource present in ACTIVE section", function () {
    dataSources.NavigateFromActiveDS(dsName, false);
    agHelper.ValidateNetworkStatus("@getDatasourceStructure");
    agHelper.GetNClick(dataSources._selectTableDropdown, 0, true);
    agHelper.GetNClickByContains(dataSources._dropdownOption, "coffeeCafe");
    GenerateCRUDNValidateDeployPage(
      "6291151eb55a625eda8526f4",
      "Mason Jar ",
      "9 of 10 ",
      0,
    );
    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad(1, 0, "v2");
    //Delete the test data
    ee.ExpandCollapseEntity("Pages");
    ee.ActionContextMenuByEntityName("CoffeeCafe", "Delete", "Are you sure?");
    agHelper.ValidateNetworkStatus("@deletePage", 200);
    deployMode.DeployApp();
    deployMode.NavigateBacktoEditor();
    dataSources.DeleteDatasouceFromActiveTab(dsName as string, 200);
  });

  //Update, delete, Add goes here

  function GenerateCRUDNValidateDeployPage(
    col1Text: string,
    col2Text: string,
    col3Text: string,
    idIndex: number,
  ) {
    agHelper.GetNClick(dataSources._generatePageBtn);
    agHelper.ValidateNetworkStatus("@replaceLayoutWithCRUDPage", 201);
    agHelper.AssertContains("Successfully generated a page"); // Commenting this since FindQuery failure appears sometimes
    agHelper.ValidateNetworkStatus("@getActions", 200);
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.GetNClick(dataSources._visibleTextSpan("Got it"));
    agHelper.ValidateNetworkStatus("@updateLayout", 200);
    deployMode.DeployApp();

    //Validating loaded table
    agHelper.AssertElementExist(dataSources._selectedRow);
    table.ReadTableRowColumnData(0, 0, "v2", 2000).then(($cellData) => {
      expect($cellData).to.eq(col1Text);
    });
    table.ReadTableRowColumnData(0, 3, "v2", 200).then(($cellData) => {
      expect($cellData).to.eq(col2Text);
    });
    table.ReadTableRowColumnData(0, 6, "v2", 200).then(($cellData) => {
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
