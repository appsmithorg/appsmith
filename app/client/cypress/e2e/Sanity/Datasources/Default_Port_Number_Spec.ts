import { agHelper, dataSources } from "../../../support/Objects/ObjectsCore";

describe(
  "Test default port value for all datasources - tests #32136",
  { tags: ["@tag.Datasource", "@tag.Sanity"] },
  () => {
    it("1. Test datasource port number default value", () => {
      // MsSQL
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("Microsoft SQL Server");

      let expectedDefaultValue = "1433";
      agHelper.AssertAttribute(
        dataSources._port,
        "value",
        expectedDefaultValue,
      );

      // Oracle
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("Oracle");

      expectedDefaultValue = "1521";
      agHelper.AssertAttribute(
        dataSources._port,
        "value",
        expectedDefaultValue,
      );

      // SMTP
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("SMTP");

      expectedDefaultValue = "25";
      agHelper.AssertAttribute(
        dataSources._port,
        "value",
        expectedDefaultValue,
      );

      // MySQL
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("MySQL");

      expectedDefaultValue = "3306";
      agHelper.AssertAttribute(
        dataSources._port,
        "value",
        expectedDefaultValue,
      );

      // Postgres
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("PostgreSQL");

      expectedDefaultValue = "5432";
      agHelper.AssertAttribute(
        dataSources._port,
        "value",
        expectedDefaultValue,
      );

      // MongoDB
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("MongoDB");

      expectedDefaultValue = "27017";
      agHelper.AssertAttribute(
        dataSources._port,
        "value",
        expectedDefaultValue,
      );

      // Elasticsearch
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("Elasticsearch");

      expectedDefaultValue = "9200";
      agHelper.AssertAttribute(
        dataSources._port,
        "value",
        expectedDefaultValue,
      );

      // Redis
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("Redis");

      expectedDefaultValue = "6379";
      agHelper.AssertAttribute(
        dataSources._port,
        "value",
        expectedDefaultValue,
      );

      // Redshift
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("Redshift");

      expectedDefaultValue = "5439";
      agHelper.AssertAttribute(
        dataSources._port,
        "value",
        expectedDefaultValue,
      );

      // ArangoDB
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("ArangoDB");

      expectedDefaultValue = "8529";
      agHelper.AssertAttribute(
        dataSources._port,
        "value",
        expectedDefaultValue,
      );
    });
  },
);
