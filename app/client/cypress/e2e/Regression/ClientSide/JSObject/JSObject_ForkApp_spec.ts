import {
  agHelper,
  assertHelper,
  homePage,
  locators,
} from "../../../../support/Objects/ObjectsCore";
import HomePage from "../../../../locators/HomePage";

describe("Fork application", {}, function () {
  it("1. Fork app and verify", () => {
    homePage.ImportApp("jsObjectTesting.json");
    agHelper.GetNClick(homePage._applicationName);
    agHelper.GetNClickByContains;
    agHelper.GetNClickByContains(
      HomePage.applicationEditMenu,
      "Fork application",
    );
    agHelper.GetNClick(locators._forkAppToWorkspaceBtn);
    assertHelper.AssertNetworkStatus("@postForkAppWorkspace", 200);
    agHelper.WaitUntilEleDisappear(homePage._forkModal);
    homePage.NavigateToHome();
    agHelper.AssertElementExist(
      `${homePage._applicationCard}:contains('JS object testing upto 1.5 MB (1)')`,
    );
  });
});
