import {
  agHelper,
  dataSources,
  locators,
  propPane,
  dataManager,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Validate Empty DS error messages",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  () => {
    let dataSourceName: string;

    afterEach("Delete DS", () => {
      dataSources.DeleteDSDirectly(200, false);
    });

    it("1. Postgress connection errors", () => {
      dataSources.NavigateToDSCreateNew();
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        dataSources.CreatePlugIn("PostgreSQL");
        dataSourceName = "PostgreSQL" + " " + uid;
        agHelper.RenameDatasource(dataSourceName);

        dataSources.TestDatasource(false);
        agHelper.ValidateToastMessage("Missing username for authentication.");
        agHelper.ValidateToastMessage("Missing hostname.");
        agHelper.ClearTextField(dataSources._databaseName);
        dataSources.TestDatasource(false);
        agHelper.ValidateToastMessage("Missing database name.");
        agHelper.WaitUntilAllToastsDisappear();
        agHelper.ClearNType(
          dataSources._host(),
          dataManager.dsValues[dataManager.defaultEnviorment].postgres_host,
        );
        agHelper.ClearNType(
          dataSources._port,
          dataManager.dsValues[
            dataManager.defaultEnviorment
          ].postgres_port.toString(),
        );
        agHelper.ClearNType(
          dataSources._databaseName,
          dataManager.dsValues[dataManager.defaultEnviorment]
            .postgres_databaseName,
        );
        agHelper.ClearNType(
          dataSources._username,
          dataManager.dsValues[dataManager.defaultEnviorment].postgres_username,
        );
        dataSources.TestDatasource(false);
        agHelper.ValidateToastMessage("Missing password for authentication.");
        agHelper.GetNClick(locators._visibleTextSpan("Read only"));
        propPane.AssertPropertiesDropDownValues("SSL mode", [
          "Default",
          "Allow",
          "Prefer",
          "Require",
          "Disable",
        ]);
        dataSources.ValidateNSelectDropdown("SSL mode", "Default", "Disable");
        agHelper.ClearNType(
          dataSources._password,
          dataManager.dsValues[dataManager.defaultEnviorment].postgres_password,
        );
        dataSources.TestSaveDatasource();
        dataSources.selectTabOnDatasourcePage("Configurations");
        dataSources.AssertDataSourceInfo([
          "READ_ONLY",
          "host.docker.internal",
          "fakeapi",
        ]);
      });
    });

    it("2. MySQL connection errors", () => {
      dataSources.NavigateToDSCreateNew();
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        dataSources.CreatePlugIn("MySQL");
        dataSourceName = "MySQL" + " " + uid;
        agHelper.RenameDatasource(dataSourceName);

        dataSources.TestDatasource(false);
        agHelper.ValidateToastMessage("Host value cannot be empty");
        agHelper.ValidateToastMessage("Missing username for authentication.");
        agHelper.ValidateToastMessage("Missing password for authentication.");
        agHelper.ClearTextField(dataSources._databaseName);
        dataSources.TestDatasource(false);
        agHelper.ValidateToastMessage("Missing database name.");
        agHelper.WaitUntilAllToastsDisappear();
        agHelper.ClearNType(
          dataSources._host(),
          dataManager.dsValues[dataManager.defaultEnviorment].mysql_host,
        );
        agHelper.ClearNType(
          dataSources._databaseName,
          dataManager.dsValues[dataManager.defaultEnviorment]
            .mysql_databaseName,
        );
        agHelper.ClearNType(
          dataSources._username,
          dataManager.dsValues[dataManager.defaultEnviorment].mysql_username,
        );
        dataSources.TestDatasource(false);
        agHelper.ValidateToastMessage("Access denied for user");
        propPane.AssertPropertiesDropDownValues("SSL mode", [
          "Default",
          "Required",
          "Disabled",
        ]);
        dataSources.ValidateNSelectDropdown("SSL mode", "Default", "Required");
        agHelper.ClearNType(
          dataSources._password,
          dataManager.dsValues[dataManager.defaultEnviorment].mysql_password,
        );
        dataSources.TestDatasource(false);
        agHelper.ValidateToastMessage(
          "Trying to connect with ssl, but ssl not enabled in the server",
        );
        dataSources.ValidateNSelectDropdown("SSL mode", "Required", "Disabled");
        dataSources.TestSaveDatasource();
        dataSources.selectTabOnDatasourcePage("Configurations");
        dataSources.AssertDataSourceInfo(["host.docker.internal", "fakeapi"]);
      });
    });

    it("3. Mongo connection errors", () => {
      dataSources.NavigateToDSCreateNew();
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        dataSources.CreatePlugIn("MongoDB");
        dataSourceName = "MongoDB" + " " + uid;
        agHelper.RenameDatasource(dataSourceName);

        dataSources.TestDatasource(false);
        agHelper.ValidateToastMessage(
          "Connection timed out. Please check if the datasource configuration fields have been filled correctly.",
        );
        dataSources.ValidateNSelectDropdown(
          "Use mongo connection string URI",
          "No",
          "Yes",
        );
        dataSources.TestDatasource(false);
        agHelper.ValidateToastMessage(
          "'Mongo Connection string URI' field is empty. Please edit the 'Mongo Connection URI' field to provide a connection uri to connect with.",
        );
        agHelper.ClearNType(
          locators._inputFieldByName("Connection string URI") + "//input",
          dataManager.mongo_uri(dataManager.defaultEnviorment),
        );
        dataSources.TestDatasource();
        dataSources.ValidateNSelectDropdown(
          "Use mongo connection string URI",
          "Yes",
          "No",
        );
        agHelper.GetNClick(locators._visibleTextSpan("Read only"));
        propPane.AssertPropertiesDropDownValues("Connection type", [
          "Direct connection",
          "Replica set",
        ]);
        dataSources.ValidateNSelectDropdown(
          "Connection type",
          "Direct connection",
          "Replica set",
        );
        dataSources.TestDatasource(false);
        agHelper.ValidateToastMessage(
          "REPLICA_SET connections should not be given a port. If you are trying to specify all the shards, please add more than one.",
        );
        agHelper.ClearNType(
          dataSources._host(),
          dataManager.dsValues[dataManager.defaultEnviorment].mongo_host,
        );
        agHelper.ClearNType(
          dataSources._port,
          dataManager.dsValues[
            dataManager.defaultEnviorment
          ].mongo_port.toString(),
        );
        dataSources.TestDatasource(false);
        agHelper.ValidateToastMessage(
          "REPLICA_SET connections should not be given a port. If you are trying to specify all the shards, please add more than one.",
        );
        propPane.AssertPropertiesDropDownValues("Authentication type", [
          "SCRAM-SHA-1",
          "SCRAM-SHA-256",
          "MONGODB-CR",
        ]);
        agHelper.ClearTextField(dataSources._databaseName);
        dataSources.TestDatasource(false);
        agHelper.ValidateToastMessage(
          "Authentication database name is invalid, no database found with this name.",
        );
        dataSources.ValidateNSelectDropdown(
          "Connection type",
          "Replica set",
          "Direct connection",
        );
        agHelper.ClearNType(
          dataSources._databaseName,
          dataManager.dsValues[dataManager.defaultEnviorment]
            .mongo_databaseName,
        );
        dataSources.ValidateNSelectDropdown(
          "Authentication type",
          "SCRAM-SHA-1",
          "MONGODB-CR",
        );
        propPane.AssertPropertiesDropDownValues("SSL mode", [
          "Default",
          "Enabled",
          "Disabled",
        ]);
        dataSources.ValidateNSelectDropdown("SSL mode", "Default", "Disabled");
        dataSources.TestSaveDatasource();
        dataSources.AssertDataSourceInfo([
          "No",
          "READ_ONLY",
          "Direct connection",
          "host.docker.internal",
          "28017",
        ]);
      });
    });

    it("4. Redis connection errors", () => {
      dataSources.NavigateToDSCreateNew();
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        dataSources.CreatePlugIn("Redis");
        dataSourceName = "Redis" + " " + uid;
        agHelper.RenameDatasource(dataSourceName);

        dataSources.TestDatasource(false);
        agHelper.ValidateToastMessage(
          "Could not find host address. Please edit the 'Host address' field to provide the desired endpoint.",
        );
        dataSources.FillRedisDSForm();
        dataSources.TestSaveDatasource();
        dataSources.AssertDataSourceInfo(["host.docker.internal", "6379"]);
      });
    });

    //MSsql error connections verified in MsSQL_Basic_Spec

    it("5. S3 connection errors", () => {
      //Open bug
      dataSources.NavigateToDSCreateNew();
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        dataSources.CreatePlugIn("S3");
        dataSourceName = "S3" + " " + uid;
        agHelper.RenameDatasource(dataSourceName);

        dataSources.TestDatasource(false);
        agHelper.ValidateToastMessage(
          "Mandatory parameter 'Secret key' is empty. Did you forget to edit the 'Secret key' field in the datasource creation form ? You need to fill it with your AWS Secret Key.",
        );
        agHelper.ValidateToastMessage(
          "Mandatory parameter 'Access key' is empty. Did you forget to edit the 'Access key' field in the datasource creation form ? You need to fill it with your AWS Access Key.",
        );
        propPane.AssertPropertiesDropDownValues("S3 service provider", [
          "Amazon S3",
          "Upcloud",
          "Digital Ocean spaces",
          "Wasabi",
          "DreamObjects",
          "MinIO",
          "Other",
        ]);
        // Below is commented due to bug
        // dataSources.ValidateNSelectDropdown(
        //   "S3 service provider",
        //   "Amazon S3",
        //   "Upcloud",
        // );
        // dataSources.TestDatasource(false);
        // agHelper.ValidateToastMessage(
        //   "Mandatory parameter 'Secret key' is empty. Did you forget to edit the 'Secret key' field in the datasource creation form ? You need to fill it with your AWS Secret Key.",
        // );
        // agHelper.ValidateToastMessage(
        //   "Mandatory parameter 'Access key' is empty. Did you forget to edit the 'Access key' field in the datasource creation form ? You need to fill it with your AWS Access Key.",
        // );
        // agHelper.ValidateToastMessage(
        //   "Required parameter 'Endpoint URL' is empty. Did you forget to edit the 'Endpoint URL' field in the datasource creation form ? You need to fill it with the endpoint URL of your S3 instance.",
        // );
        // dataSources.ValidateNSelectDropdown(
        //   "S3 service provider",
        //   "Upcloud",
        //   "Amazon S3",
        // );
        dataSources.FillS3DSForm();
        dataSources.TestSaveDatasource();
        dataSources.AssertDataSourceInfo([
          "S3 service provider",
          "Amazon S3",
          "Access key",
          Cypress.env("S3_ACCESS_KEY"),
        ]);
      });
    });
  },
);
