import {
  agHelper,
  apiPage,
  dataManager,
  debuggerHelper,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Inconsistent Api error after the invalid chars are removed from header key",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
    it("1. Checking whether the appropriate error is displayed even after the removal of invalid chars in header key.", function () {
      const randomApi = `${
        dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl
      }123`;
      apiPage.CreateAndFillApi(randomApi);
      apiPage.RunAPI(false, 50, {
        expectedPath: "response.body.data.body.data.isExecutionSuccess",
        expectedRes: false,
      });

      agHelper.AssertElementAbsence(
        debuggerHelper.locators._debuggerDownStreamErrMsg,
      );

      apiPage.EnterHeader(">", "");
      apiPage.RunAPI(false, 50, {
        expectedPath: "response.body.data.body.data.isExecutionSuccess",
        expectedRes: false,
      });

      cy.get("@postExecute").then((interception: any) => {
        debuggerHelper.AssertDownStreamLogError(
          interception.response.body.data.pluginErrorDetails
            .downstreamErrorMessage,
        );
      });

      apiPage.EnterHeader("", "");
      apiPage.RunAPI(false, 50, {
        expectedPath: "response.body.data.body.data.isExecutionSuccess",
        expectedRes: false,
      });
      agHelper.AssertElementAbsence(
        debuggerHelper.locators._debuggerDownStreamErrMsg,
      );
    });
  },
);
