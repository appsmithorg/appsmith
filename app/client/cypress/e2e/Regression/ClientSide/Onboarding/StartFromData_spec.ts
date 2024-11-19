import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import {
  agHelper,
  onboarding,
  dataSources,
  homePage,
  assertHelper,
  apiPage,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Start with data userflow : Create different datasources and save",
  {
    tags: [
      "@tag.excludeForAirgap",
      "@tag.Datasource",
      "@tag.Git",
      "@tag.AccessControl",
    ],
  },
  function () {
    beforeEach(() => {
      homePage.Signout();
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        homePage.SignUp(
          `${uid}@appsmithtest.com`,
          uid as unknown as string,
          false,
        );
        onboarding.closeIntroModal();
      });
    });

    it("1. Postgres : should take me to datasource page with view mode", function () {
      assertHelper.AssertNetworkStatus("@getPlugins");
      dataSources.CreateDataSource("Postgres", false);
      dataSources.selectTabOnDatasourcePage("View data");
      agHelper.TypeText(dataSources._datasourceStructureSearchInput, "users");
      agHelper.GetNClick(
        dataSources._dsPageTabContainerTableName("public.users"),
      );
      assertHelper.AssertNetworkExecutionSuccess("@schemaPreview");
      agHelper.AssertElementAbsence(
        dataSources._dsPageTableTriggermenuTarget("public.users"),
      );
    });

    it("2. Mysql : should take me to datasource page with view mode", function () {
      assertHelper.AssertNetworkStatus("@getPlugins");
      dataSources.CreateDataSource("MySql", false);
      dataSources.selectTabOnDatasourcePage("View data");
      assertHelper.AssertNetworkExecutionSuccess("@schemaPreview");
      agHelper.AssertElementExist(dataSources._dsSchemaTableResponse);
    });

    it("3. S3 : should take me to datasource page", function () {
      assertHelper.AssertNetworkStatus("@getPlugins");
      dataSources.CreateDataSource("S3", false);
      dataSources.CreateQueryAfterDSSaved("", "S3Query");
    });

    it("4. Airtable : should take me to datasource page", function () {
      assertHelper.AssertNetworkStatus("@getPlugins");
      dataSources.CreateDataSource("Airtable", false, false);
      dataSources.CreateQueryAfterDSSaved("", "AirtableQuery");
    });

    it("5. Rest API action : should take me to action page directly", function () {
      assertHelper.AssertNetworkStatus("@getPlugins");
      agHelper.GetNClick(apiPage._createapi, 0);
      assertHelper.AssertNetworkStatus("@createNewApi", 201);
    });
  },
);
