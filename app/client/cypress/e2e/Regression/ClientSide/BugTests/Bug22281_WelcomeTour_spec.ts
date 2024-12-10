import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Welcome tour spec", { tags: ["@tag.excludeForAirgap"] }, function () {
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
    _.agHelper.GetNAssertContains(_.locators._errorTab, "Linter");
  });
});
