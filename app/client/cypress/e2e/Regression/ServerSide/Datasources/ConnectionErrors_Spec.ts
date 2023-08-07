import {
  agHelper,
  dataSources,
  locators,
  propPane,
  tedTestConfig,
} from "../../../../support/Objects/ObjectsCore";

describe("Validate Empty DS error messages", () => {
  let dataSourceName: string;
  it("1. Postgress connection errors", () => {
    dataSources.NavigateToDSCreateNew();
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      dataSources.CreatePlugIn("PostgreSQL");
      dataSourceName = "PostgreSQL" + " " + uid;
      agHelper.RenameWithInPane(dataSourceName, false);

      dataSources.TestDatasource(false);
      agHelper.ValidateToastMessage("Missing endpoint.");
      agHelper.ValidateToastMessage("Missing username for authentication.", 1);
      agHelper.ClearTextField(dataSources._databaseName);
      dataSources.TestDatasource(false);
      agHelper.ValidateToastMessage("Missing database name.", 2);
      agHelper.WaitUntilAllToastsDisappear();
      agHelper.UpdateInputValue(
        dataSources._host,
        tedTestConfig.dsValues[tedTestConfig.defaultEnviorment].postgres_host,
      );
      agHelper.UpdateInputValue(
        dataSources._databaseName,
        tedTestConfig.dsValues[tedTestConfig.defaultEnviorment]
          .postgres_databaseName,
      );
      agHelper.UpdateInputValue(
        dataSources._username,
        tedTestConfig.dsValues[tedTestConfig.defaultEnviorment]
          .postgres_username,
      );
      dataSources.TestDatasource(false);
      agHelper.ValidateToastMessage(
        "An exception occurred while creating connection pool. One or more arguments in the datasource configuration may be invalid.",
      );
      agHelper.ValidateToastMessage(
        "Failed to initialize pool: The server requested password-based authentication, but no password was provided by plugin null",
        1,
      );
      agHelper.GetNClick(locators._visibleTextSpan("Read only"));
      propPane.AssertPropertiesDropDownValues("SSL mode", [
        "Default",
        "Allow",
        "Prefer",
        "Require",
        "Disable",
      ]);
      dataSources.ValidateNSelectDropdown("SSL mode", "Default", "Disable");
      agHelper.UpdateInputValue(
        dataSources._password,
        tedTestConfig.dsValues[tedTestConfig.defaultEnviorment]
          .postgres_password,
      );
      dataSources.TestSaveDatasource();
      dataSources.AssertDataSourceInfo([
        "READ_ONLY",
        "host.docker.internal",
        "fakeapi",
      ]);
      dataSources.DeleteDSDirectly();
    });
  });

  it("2. MySQL connection errors", () => {
    dataSources.NavigateToDSCreateNew();
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      dataSources.CreatePlugIn("MySQL");
      dataSourceName = "MySQL" + " " + uid;
      agHelper.RenameWithInPane(dataSourceName, false);

      dataSources.TestDatasource(false);
      agHelper.ValidateToastMessage("Missing endpoint and url");
      agHelper.ValidateToastMessage("Missing username for authentication.");
      agHelper.ValidateToastMessage("Missing password for authentication.");
      agHelper.ClearTextField(dataSources._databaseName);
      dataSources.TestDatasource(false);
      agHelper.ValidateToastMessage("Missing database name.");
      agHelper.WaitUntilAllToastsDisappear();
      agHelper.UpdateInputValue(
        dataSources._host,
        tedTestConfig.dsValues[tedTestConfig.defaultEnviorment].mysql_host,
      );
      agHelper.UpdateInputValue(
        dataSources._databaseName,
        tedTestConfig.dsValues[tedTestConfig.defaultEnviorment]
          .mysql_databaseName,
      );
      agHelper.UpdateInputValue(
        dataSources._username,
        tedTestConfig.dsValues[tedTestConfig.defaultEnviorment].mysql_username,
      );
      dataSources.TestDatasource(false);
      agHelper.ValidateToastMessage(
        "Access denied for user 'root'@'172.17.0.1'",
      );
      agHelper.GetNClick(locators._visibleTextSpan("Read only"));
      propPane.AssertPropertiesDropDownValues("SSL mode", [
        "Default",
        "Required",
        "Disabled",
      ]);
      dataSources.ValidateNSelectDropdown("SSL mode", "Default", "Required");
      agHelper.UpdateInputValue(
        dataSources._password,
        tedTestConfig.dsValues[tedTestConfig.defaultEnviorment].mysql_password,
      );
      dataSources.TestDatasource(false);
      agHelper.ValidateToastMessage(
        "Trying to connect with ssl, but ssl not enabled in the server",
      );
      dataSources.ValidateNSelectDropdown("SSL mode", "Required", "Disabled");
      dataSources.TestSaveDatasource();
      dataSources.AssertDataSourceInfo([
        "READ_ONLY",
        "host.docker.internal",
        "fakeapi",
      ]);
      dataSources.DeleteDSDirectly();
    });
  });
});
