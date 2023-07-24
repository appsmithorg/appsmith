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
    agHelper.GoBack();

    // Oracle
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("Oracle");

    expectedPlaceholderValue = "1521";
    agHelper.AssertAttribute(
      dataSources._port,
      "placeholder",
      expectedPlaceholderValue,
    );
    agHelper.GoBack();

    // SMTP
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("SMTP");

    expectedPlaceholderValue = "25";
    agHelper.AssertAttribute(
      dataSources._port,
      "placeholder",
      expectedPlaceholderValue,
    );
    agHelper.GoBack();

    // MySQL
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("MySQL");

    expectedPlaceholderValue = "3306";
    agHelper.AssertAttribute(
      dataSources._port,
      "placeholder",
      expectedPlaceholderValue,
    );
    agHelper.GoBack();

    // Postgres
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("PostgreSQL");

    expectedPlaceholderValue = "5432";
    agHelper.AssertAttribute(
      dataSources._port,
      "placeholder",
      expectedPlaceholderValue,
    );
    agHelper.GoBack();

    // MongoDB
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("MongoDB");

    expectedPlaceholderValue = "27017";
    agHelper.AssertAttribute(
      dataSources._port,
      "placeholder",
      expectedPlaceholderValue,
    );
    agHelper.GoBack();

    // Elasticsearch
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("Elasticsearch");

    expectedPlaceholderValue = "9200";
    agHelper.AssertAttribute(
      dataSources._port,
      "placeholder",
      expectedPlaceholderValue,
    );
    agHelper.GoBack();

    // Redis
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("Redis");

    expectedPlaceholderValue = "6379";
    agHelper.AssertAttribute(
      dataSources._port,
      "placeholder",
      expectedPlaceholderValue,
    );
    agHelper.GoBack();

    // Redshift
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("Redshift");

    expectedPlaceholderValue = "5439";
    agHelper.AssertAttribute(
      dataSources._port,
      "placeholder",
      expectedPlaceholderValue,
    );
    agHelper.GoBack();

    // ArangoDB
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("ArangoDB");

    expectedPlaceholderValue = "8529";
    agHelper.AssertAttribute(
      dataSources._port,
      "placeholder",
      expectedPlaceholderValue,
    );
    agHelper.GoBack();
  });
});
