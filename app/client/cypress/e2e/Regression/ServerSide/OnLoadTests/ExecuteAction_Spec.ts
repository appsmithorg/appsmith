import {
  agHelper,
  assertHelper,
  deployMode,
  homePage,
  locators,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Execute Action Functionality",
  { tags: ["@tag.PropertyPane", "@tag.JS"] },
  function () {
    before(() => {
      homePage.ImportApp("executeAction.json");
    });

    it("1. Checks whether execute action is getting called on page load only once", function () {
      agHelper.AssertElementVisibility(locators._widgetInCanvas("textwidget"));
      deployMode.DeployApp();

      assertHelper.AssertNetworkStatus("@postExecute", 200, true);

      agHelper.GetNAssertContains(
        locators._widgetInDeployed("textwidget"),
        "User count :5",
      );

      let completedIds: any;

      cy.get("@postExecute.all")
        .then((respBody) => {
          const totalRequests = [
            ...new Set(respBody.map((req: any) => req.browserRequestId)),
          ];
          completedIds = totalRequests;
          return totalRequests;
        })
        .should("have.length", 2); //Count from Initial Import + Deployed Mode - Page 1 execute call - hence count 2
      agHelper.Sleep(500);

      agHelper.GetNClickByContains(locators._deployedPage, "Page2");

      assertHelper.AssertNetworkStatus("@getConsolidatedData", 200, true);
      assertHelper.AssertNetworkStatus("@postExecute", 200, true);

      agHelper.GetNAssertContains(
        locators._widgetInDeployed("textwidget"),
        "User count :10",
      );

      cy.wait(2000);

      cy.get("@postExecute.all")
        .then((respBody) => {
          const totalRequests = [
            ...new Set(respBody.map((req: any) => req.browserRequestId)),
          ];
          return totalRequests.filter((reqId) => !completedIds.includes(reqId));
        })
        .should("have.length", 1); // Since Page 2 is switched - previous count is washed out, and this is only call

      agHelper.GetNClickByContains(locators._deployedPage, "Page1");

      assertHelper.AssertNetworkStatus("@getConsolidatedData", 200, true);
      assertHelper.AssertNetworkStatus("@postExecute", 200, true);

      agHelper.GetNAssertContains(
        locators._widgetInDeployed("textwidget"),
        "User count :5",
      );

      cy.wait(2000);

      cy.get("@postExecute.all")
        .then((respBody) => {
          const totalRequests = [
            ...new Set(respBody.map((req: any) => req.browserRequestId)),
          ];
          return totalRequests.filter((reqId) => !completedIds.includes(reqId));
        })
        .should("have.length", 2); // Since its within deployed page, switching to Page 1 , adds one more to previous count!
    });
  },
);
