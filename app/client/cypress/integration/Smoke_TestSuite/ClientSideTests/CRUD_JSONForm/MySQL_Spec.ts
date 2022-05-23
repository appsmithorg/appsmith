import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let guid: any;
let agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  locator = ObjectsRegistry.CommonLocators,
  table = ObjectsRegistry.Table,
  homePage = ObjectsRegistry.HomePage,
  dataSources = ObjectsRegistry.DataSources;

describe("Validate MySQL Generate CRUD with JSON Form", () => {
  it("1. Add new Page and generate CRUD template using existing supported datasource", () => {
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("MySQL");
      guid = uid;
      agHelper.RenameWithInPane("MySQL " + guid, false);
      dataSources.FillMySqlDSForm();
      dataSources.TestSaveDatasource();

      ee.AddNewPage();
      agHelper.GetNClick(homePage._buildFromDataTableActionCard);
      agHelper.GetNClick(dataSources._selectDatasourceDropdown);
      agHelper.GetNClickByContains(
        dataSources._datasourceDropdownOption,
        "MySQL " + guid,
      );
      agHelper.ValidateNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
      agHelper.GetNClick(dataSources._selectTableDropdown);
      agHelper.GetNClickByContains(
        dataSources._tableDropdownOption,
        "worldCountryInfo",
      );
      agHelper.GetNClick(dataSources._generatePageBtn);
      agHelper.ValidateToastMessage("Successfully generated a page");
      agHelper.ValidateNetworkStatus("@replaceLayoutWithCRUDPage", 201);
      agHelper.ValidateNetworkStatus("@getActions", 200);
      agHelper.ValidateNetworkStatus("@postExecute", 200);
      agHelper.ValidateNetworkStatus("@updateLayout", 200);

      agHelper.GetNClick(dataSources._visibleTextSpan("GOT IT"));

      //Validating loaded table
      agHelper.AssertElementExist(dataSources._selectedRow);
      table.ReadTableRowColumnData(0, 0, 2000).then(($cellData) => {
        expect($cellData).to.eq("ABW");
      });
      table.ReadTableRowColumnData(0, 1, 200).then(($cellData) => {
        expect($cellData).to.eq("Aruba");
      });
      table.ReadTableRowColumnData(0, 2, 200).then(($cellData) => {
        expect($cellData).to.eq("North America");
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
      agHelper
        .GetText(locator._jsonFormHeader)
        .then(($header: any) => expect($header).to.eq("Update Row Code: ABW"));
    });
  });
});
