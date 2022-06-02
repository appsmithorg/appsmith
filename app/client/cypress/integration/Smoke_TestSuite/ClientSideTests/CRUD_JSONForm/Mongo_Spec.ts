import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let guid: any;
let agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  locator = ObjectsRegistry.CommonLocators,
  homePage = ObjectsRegistry.HomePage,
  dataSources = ObjectsRegistry.DataSources;

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
      agHelper.ValidateNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
      agHelper.GetNClick(dataSources._selectTableDropdown);
      agHelper.GetNClickByContains(
        dataSources._dropdownOption,
        "pokemon",
      );
      agHelper.GetNClick(dataSources._generatePageBtn);
    });
  });
});
