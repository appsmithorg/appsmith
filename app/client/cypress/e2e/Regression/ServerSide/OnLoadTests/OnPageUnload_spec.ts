// Import necessary helpers and libraries.
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import {
  agHelper,
  appSettings,
  assertHelper,
  deployMode,
  homePage,
  locators,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";
import pageList from "../../../../support/Pages/PageList";

describe(
  "On-Page Unload Functionality",
  { tags: ["@tag.JS", "@tag.Sanity"] },
  () => {
    const page1 = "Page1 - with long long name";
    const page2 = "Page2 - with long long name";
    const page3 = "Page3 - with long long name";
    const page1ToastForOnPageUnload = "Page 1 on page unload.";
    const page2ToastForOnPageUnload = "Page 2 on page unload.";
    const page1ButtonText = "Submit";
    // Setup: Runs once before all tests in this block.
    before(() => {
      homePage.NavigateToHome();
      homePage.ImportApp("onPageUnloadBehavior_app.json");
      assertHelper.AssertNetworkStatus("@importNewApplication");
      featureFlagIntercept({
        release_jsobjects_onpageunloadactions_enabled: true,
      });
    });

    it("1. [Deployed Mode] Nav via links: Triggers unload, then doesn't on return", () => {
      deployMode.DeployApp();
      // Start on Page 1 and navigate to Page 2.
      agHelper.WaitUntilEleAppear(appSettings.locators._header);
      agHelper.AssertElementVisibility(
        appSettings.locators._getActivePage(page1),
      );
      agHelper.GetNClickByContains(
        appSettings.locators._navigationMenuItem,
        page2,
      );
      agHelper.ValidateToastMessage(page1ToastForOnPageUnload);
      agHelper.GetNClickByContains(
        appSettings.locators._navigationMenuItem,
        page1,
      );
      deployMode.NavigateBacktoEditor();
    });

    it("2. [Edit Mode] Nav via Page Selector: Triggers unload", () => {
      EditorNavigation.SelectEntityByName(page2, EntityType.Page);
      agHelper.ValidateToastMessage(page1ToastForOnPageUnload);
      agHelper.WaitUntilAllToastsDisappear();

      EditorNavigation.SelectEntityByName(page3, EntityType.Page);
      agHelper.ValidateToastMessage(page2ToastForOnPageUnload);
      agHelper.WaitUntilAllToastsDisappear();

      EditorNavigation.SelectEntityByName(page1, EntityType.Page);
    });

    it("3. [Preview mode] Multiple Handlers: Triggers all handlers", () => {
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.AssertElementVisibility(
        appSettings.locators._getActivePage(page1),
      );
      agHelper.GetNClickByContains(
        appSettings.locators._navigationMenuItem,
        page2,
      );
      agHelper.ValidateToastMessage(page1ToastForOnPageUnload);
      agHelper.WaitUntilAllToastsDisappear();

      agHelper.GetNClickByContains(
        appSettings.locators._navigationMenuItem,
        page3,
      );
      agHelper.ValidateToastMessage(page2ToastForOnPageUnload);
      agHelper.WaitUntilAllToastsDisappear();
      agHelper.GetNClickByContains(
        appSettings.locators._navigationMenuItem,
        page1,
      );
      agHelper.GetNClick(locators._exitPreviewMode);
    });

    it("4. [Both Modes - Programmatic nav]: Triggers unload via button click", () => {
      agHelper.ClickButton(page1ButtonText);
      agHelper.ValidateToastMessage(page1ToastForOnPageUnload);
      agHelper.WaitUntilAllToastsDisappear();
      pageList.ShowList();
      EditorNavigation.SelectEntityByName(page1, EntityType.Page);

      deployMode.DeployApp();
      agHelper.ClickButton(page1ButtonText);
      agHelper.ValidateToastMessage(page1ToastForOnPageUnload);
      agHelper.AssertElementVisibility(
        appSettings.locators._getActivePage(page2),
      );
      agHelper.GetNClickByContains(
        appSettings.locators._navigationMenuItem,
        page1,
      );
      deployMode.NavigateBacktoEditor();
    });
  },
);
