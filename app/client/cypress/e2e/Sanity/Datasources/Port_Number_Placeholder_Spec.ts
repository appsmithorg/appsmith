import { agHelper, dataSources } from "../../../support/Objects/ObjectsCore";

describe("Test placeholder value for port number for all datasources - tests #24960", () => {
  it("1. Test datasource port number placeholder", () => {
    // MsSQL
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("Microsoft SQL Server");

    let expectedPlaceholderValue = "1433";
    agHelper.AssertAttribute(
      dataSources._port,
      "placeholder",
      expectedPlaceholderValue,
    );
    dataSources.SaveDSFromDialog(false);

    // Oracle
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("Oracle");

    expectedPlaceholderValue = "1521";
    agHelper.AssertAttribute(
      dataSources._port,
      "placeholder",
      expectedPlaceholderValue,
    );
    dataSources.SaveDSFromDialog(false);

    // SMTP
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("SMTP");

    expectedPlaceholderValue = "25";
    agHelper.AssertAttribute(
      dataSources._port,
      "placeholder",
      expectedPlaceholderValue,
    );
    dataSources.SaveDSFromDialog(false);

    // MySQL
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("MySQL");

    expectedPlaceholderValue = "3306";
    agHelper.AssertAttribute(
      dataSources._port,
      "placeholder",
      expectedPlaceholderValue,
    );
    dataSources.SaveDSFromDialog(false);

    // Postgres
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("PostgreSQL");

    expectedPlaceholderValue = "5432";
    agHelper.AssertAttribute(
      dataSources._port,
      "placeholder",
      expectedPlaceholderValue,
    );
    dataSources.SaveDSFromDialog(false);

    // MongoDB
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("MongoDB");

    expectedPlaceholderValue = "27017";
    agHelper.AssertAttribute(
      dataSources._port,
      "placeholder",
      expectedPlaceholderValue,
    );
    dataSources.SaveDSFromDialog(false);

    // Elasticsearch
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("Elasticsearch");

    expectedPlaceholderValue = "9200";
    agHelper.AssertAttribute(
      dataSources._port,
      "placeholder",
      expectedPlaceholderValue,
    );
    dataSources.SaveDSFromDialog(false);

    // Redis
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("Redis");

    expectedPlaceholderValue = "6379";
    agHelper.AssertAttribute(
      dataSources._port,
      "placeholder",
      expectedPlaceholderValue,
    );
    dataSources.SaveDSFromDialog(false);

    // Redshift
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("Redshift");

    expectedPlaceholderValue = "5439";
    agHelper.AssertAttribute(
      dataSources._port,
      "placeholder",
      expectedPlaceholderValue,
    );
    dataSources.SaveDSFromDialog(false);

    // ArangoDB
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("ArangoDB");

    expectedPlaceholderValue = "8529";
    agHelper.AssertAttribute(
      dataSources._port,
      "placeholder",
      expectedPlaceholderValue,
    );
    dataSources.SaveDSFromDialog(false);
  });
});
