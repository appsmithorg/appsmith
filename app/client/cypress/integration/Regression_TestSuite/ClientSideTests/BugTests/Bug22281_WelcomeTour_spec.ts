import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const locator = ObjectsRegistry.CommonLocators,
  agHelper = ObjectsRegistry.AggregateHelper,
  debuggerHelper = ObjectsRegistry.DebuggerHelper;

describe("Welcome tour spec", function () {
  it("Bug: 22275: Debugger should not render in preview mode", function () {
    //Open debugger
    agHelper.GetNClick(debuggerHelper.locators._debuggerIcon);
    //Enter preview mode
    agHelper.GetNClick(locator._enterPreviewMode);
    //verify debugger is not present
    agHelper.AssertElementAbsence(locator._errorTab);
    //Exit preview mode
    agHelper.GetNClick(locator._exitPreviewMode);
    //verify debugger is present
    agHelper.GetNAssertContains(locator._errorTab, "Errors");
  });
  it("Bug: 22282: Debugger should not open by default in welcome tour", function () {
    //Get back to application page
    agHelper.GetNClick(locator._appsmithLogo);
    agHelper.WaitUntilEleAppear(locator._createNewApplicationButton);
    //Start welcome tour
    agHelper.GetNClick(locator._welcomeTour);
    agHelper.WaitUntilEleAppear(locator._welcomeTourBuildingButton);
    //Verify debugger is not present
    agHelper.AssertElementAbsence(locator._errorTab);
  });
});
