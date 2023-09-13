import {
  agHelper,
  dataSources,
  propPane,
  dataManager,
} from "../../../../support/Objects/ObjectsCore";

describe("Validate Oracle DS", () => {
  let dataSourceName: string;

  // afterEach("Delete DS", () => {
  //   dataSources.DeleteDSDirectly(200, false);
  // });

  it("1. Tc #2354 - Oracle placeholder & mandatory mark verification", () => {
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("Oracle");
    agHelper.AssertAttribute(
      dataSources._host,
      "placeholder",
      "myapp.abcde.oracle.net",
    );
    agHelper.AssertAttribute(
      dataSources._databaseName,
      "placeholder",
      "gfb284db6bcee33_testdb_high.adb.oraclecloud.com",
    );
    agHelper.AssertAttribute(dataSources._username, "placeholder", "admin");
    agHelper.AssertAttribute(dataSources._password, "placeholder", "password");
    agHelper.AssertElementLength(dataSources._mandatoryMark, 4); //verifyng all 4 fields are mandatory
    agHelper.AssertText(dataSources._host, "val", "");
    agHelper.UpdateInputValue(
      dataSources._host,
      dataManager.dsValues[dataManager.environments[1]].oracle_host,
    );
    agHelper.AssertText(
      dataSources._host,
      "val",
      dataManager.dsValues[dataManager.environments[1]].oracle_host,
    );
    agHelper.GetNClick(dataSources._deleteDSHostPort); //Delete the value & verify
    agHelper.AssertText(dataSources._host, "val", "");
  });

  it("2. Tc #2357, #2356, #2355, #2354 Oracle connection errors", () => {
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      //dataSources.CreatePlugIn("Oracle");
      dataSourceName = "Oracle" + " " + uid;
      agHelper.RenameWithInPane(dataSourceName, false);
      dataSources.TestDatasource(false);
      agHelper.ValidateToastMessage("Missing endpoint");
      agHelper.ValidateToastMessage("Missing authentication details");
      agHelper.WaitUntilAllToastsDisappear();

      agHelper.UpdateInputValue(
        dataSources._host,
        dataManager.dsValues[dataManager.defaultEnviorment].oracle_host,
      );
      agHelper.UpdateInputValue(
        dataSources._databaseName,
        dataManager.dsValues[dataManager.defaultEnviorment].oracle_service,
      );
      dataSources.TestDatasource(false);
      agHelper.ValidateToastMessage("Missing username for authentication");
      agHelper.ValidateToastMessage("Missing password for authentication");

      agHelper.UpdateInputValue(
        dataSources._username,
        dataManager.dsValues[dataManager.defaultEnviorment].oracle_username,
      );
      agHelper.UpdateInputValue(
        dataSources._password,
        dataManager.dsValues[dataManager.defaultEnviorment].oracle_password,
      );
      dataSources.TestDatasource(false);
      agHelper.ValidateToastMessage(
        "An exception occurred while creating connection pool. One or more arguments in the datasource configuration may be invalid.",
      );
      agHelper.ValidateToastMessage("Failed to initialize pool:");
      propPane.AssertPropertiesDropDownValues("SSL mode", ["Disable", "TLS"]);
      dataSources.ValidateNSelectDropdown("SSL mode", "TLS", "Disable");
      dataSources.TestSaveDatasource();
      //Validate Review page
      dataSources.AssertDataSourceInfo([
        "Host address",
        "Port",
        "Service Name",
      ]);
      agHelper.ClickButton("Edit"); //Navigate to Edit page & check if DS edit is opened
      dataSources.ValidateNSelectDropdown("SSL mode", "Disable");
      agHelper.GoBack(); //Do not edit anythin, go back to active ds list, ensure no modal is opened
      dataSources.AssertDSInActiveList(dataSourceName);
    });
  });
});
