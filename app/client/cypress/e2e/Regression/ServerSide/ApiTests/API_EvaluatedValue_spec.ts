import { apiPage, dataManager } from "../../../../support/Objects/ObjectsCore";

describe(
  "Validate API URL Evaluated value",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  () => {
    it("1. Check if url object does not crash App", () => {
      apiPage.CreateApi("FirstAPI");
      apiPage.EnterURL(`{{{"key": "value"}}}`, `{"key":"value"}`);
    });

    // https://github.com/appsmithorg/appsmith/issues/24696
    it("2. Check if path field strings have not been JSON.stringified - #24696", () => {
      apiPage.CreateApi("SecondAPI");
      apiPage.EnterURL(
        dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl +
          `/{{SecondAPI.isLoading}}`,
        dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl +
          `/false`,
      );
    });
  },
);
