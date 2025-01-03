import HomePage from "../../../../locators/HomePage";
import { jsEditor, agHelper } from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

describe(
  " To test [Bug]: Function settings of a JS Object are not obeyed when copied/moved to another page #31475",
  { tags: ["@tag.JS"] },
  () => {
    // Bug: https://github.com/appsmithorg/appsmith/issues/31475
    it.skip("Verify if settings are replicated in a copied JS Object", () => {
      jsEditor.CreateJSObject("", { prettify: false, toRun: false });

      // Step 2: Add a new blank page
      PageList.AddNewPage("New blank page");

      // Step 3: Navigate back to the source page
      EditorNavigation.NavigateToPage("Page1", true);

      // Step 4: Switch to the JS Objects segment in the left pane
      PageLeftPane.switchSegment(PagePaneSegment.JS);

      // Step 5: Enable "Run on page load" for a specific function
      jsEditor.EnableDisableAsyncFuncSettings("myFun1");

      // Step 6: Copy the JS Object to the target page
      agHelper.GetNClick(jsEditor._moreActions, 0, true);
      agHelper.HoverElement(
        `${HomePage.portalMenuItem}:contains("Copy to page")`,
      );
      agHelper.GetNClick(`${HomePage.portalMenuItem}:contains("Page2")`);

      // Step 7: Refresh the page to ensure the JS Object is updated
      agHelper.RefreshPage();

      // Step 8: Verify that the "Run on page load" setting is still enabled for the function
      jsEditor.VerifyAsyncFuncSettings("myFun1", true);
    });
  },
);
