import * as _ from "../../../../support/Objects/ObjectsCore";

describe("excludeForAirgap", "Welcome tour spec", function () {
  it("1. Bug: 22275: Debugger should not render in preview mode", function () {
    //Open debugger
    _.agHelper.GetNClick(_.debuggerHelper.locators._debuggerIcon);
    //Enter preview mode
    _.agHelper.GetNClick(_.locators._enterPreviewMode);
    //verify debugger is not present
    _.agHelper.AssertElementAbsence(_.locators._errorTab);
    //Exit preview mode
    _.agHelper.GetNClick(_.locators._exitPreviewMode);
    //verify debugger is present
    _.agHelper.GetNAssertContains(_.locators._errorTab, "Errors");
  });
  it("2. Bug: 22281: Debugger should not open by default in welcome tour", function () {
    //Get back to application page
    _.homePage.NavigateToHome();
    _.agHelper.WaitUntilEleAppear(_.homePage._homePageAppCreateBtn);

    // Temporary workaround until https://github.com/appsmithorg/appsmith/issues/24665 is fixed
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      _.homePage.CreateNewWorkspace("GuidedtourWorkspace" + uid);
      _.homePage.CreateAppInWorkspace(
        "GuidedtourWorkspace" + uid,
        `GuidedtourApp${uid}`,
      );
      _.homePage.NavigateToHome();
    });

    //Start welcome tour
    _.agHelper.GetNClick(_.homePage._welcomeTour);
    _.agHelper.WaitUntilEleAppear(_.homePage._welcomeTourBuildingButton);
    //Verify debugger is not present
    _.agHelper.AssertElementAbsence(_.locators._errorTab);
  });
});
