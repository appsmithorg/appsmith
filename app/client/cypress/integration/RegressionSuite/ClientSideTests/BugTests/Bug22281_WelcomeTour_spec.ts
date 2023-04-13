import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Welcome tour spec", function () {
  it("Bug: 22275: Debugger should not render in preview mode", function () {
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
  it("Bug: 22281: Debugger should not open by default in welcome tour", function () {
    //Get back to application page
    _.agHelper.GetNClick(_.homePage._homeIcon);
    _.agHelper.WaitUntilEleAppear(_.homePage._homePageAppCreateBtn);
    //Start welcome tour
    _.agHelper.GetNClick(_.homePage._welcomeTour);
    _.agHelper.WaitUntilEleAppear(_.homePage._welcomeTourBuildingButton);
    //Verify debugger is not present
    _.agHelper.AssertElementAbsence(_.locators._errorTab);
  });
});
