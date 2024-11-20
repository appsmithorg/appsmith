import {
  agHelper,
  apiPage,
  dataManager,
  dataSources,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Block Action Execution when no field is present",
  { tags: ["@tag.Datasource"] },
  () => {
    const url = "https://www.google.com/";
    it("1. Ensure API Run button is disabled when no url is present", () => {
      apiPage.CreateApi("FirstAPI", "GET");
      apiPage.AssertRunButtonDisability(true);
      apiPage.EnterURL(url);
      apiPage.AssertRunButtonDisability(false);
    });

    it("2. Ensure Run button is disabled when no SQL body field is present", () => {
      let name: any;
      dataSources.CreateDataSource("MySql", true, false);
      cy.get("@dsName").then(($dsName) => {
        name = $dsName;

        agHelper.Sleep(1000);
        dataSources.CreateQueryAfterDSSaved();
        dataSources.EnterQuery("SELECT * from users");
        dataSources.AssertRunButtonDisability(false);
        dataSources.EnterQuery("");
        dataSources.AssertRunButtonDisability(true);
      });
    });

    it("3. Ensure Run button is disabled for Post UQI Datasources e.g. Oracle when no body data is present", () => {
      let name: any;
      dataSources.CreateDataSource(
        "Oracle",
        true,
        false,
        dataManager.environments[1], //using staging mock data
      );
      cy.get("@dsName").then(($dsName) => {
        name = $dsName;

        agHelper.Sleep(1000);
        dataSources.CreateQueryAfterDSSaved();
        dataSources.EnterQuery("SELECT * from users");
        dataSources.AssertRunButtonDisability(false);
        dataSources.EnterQuery("");
        dataSources.AssertRunButtonDisability(true);
      });
    });
  },
);
