import * as _ from "../../../../support/Objects/ObjectsCore";
import { PageType } from "../../../../support/Pages/DebuggerHelper";
import EditorNavigation, {
  EditorViewMode,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Api Error Debugger",
  { tags: ["@tag.IDE", "@tag.PropertyPane"] },
  () => {
    before(() => {
      // Create api that causes an error
      _.apiPage.CreateAndFillApi("https://fakeapi/user");
    });
    it("it shows error message", () => {
      _.apiPage.RunAPI(false);
      _.debuggerHelper.AssertOpen(PageType.API);
      _.apiPage.ResponseStatusCheck("PE-RST-5000");
    });
    it("it shows debug button and navigates", () => {
      _.apiPage.DebugError();
      _.debuggerHelper.AssertSelectedTab(
        Cypress.env("MESSAGES").DEBUGGER_ERRORS(),
      );
      _.debuggerHelper.AssertErrorCount(1);
      EditorNavigation.SwitchScreenMode(EditorViewMode.SplitScreen);
      _.apiPage.DebugError();
      _.debuggerHelper.AssertSelectedTab(
        Cypress.env("MESSAGES").DEBUGGER_ERRORS(),
      );
      _.debuggerHelper.AssertErrorCount(1);
    });
  },
);
