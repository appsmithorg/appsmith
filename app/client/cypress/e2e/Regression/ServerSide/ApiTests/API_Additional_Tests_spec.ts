import {
  debuggerHelper,
  homePage,
} from "../../../../support/Objects/ObjectsCore";
import { apiPage } from "../../../../support/Objects/ObjectsCore";
import {
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";
import FileTabs from "../../../../support/Pages/IDE/FileTabs";
import PageList from "../../../../support/Pages/PageList";

let repoName;

describe(
  "Additional API tests",
  { tags: ["@tag.Datasource", "@tag.Git"] },
  () => {
    it("1. Validate renaming & copying API from editor", () => {
      // Create first API
      apiPage.CreateApi();
      // Rename the API
      apiPage.renameFromEditor("changedName");
      // Create second API
      apiPage.CreateApi("secondApi", "GET");
      // Add a new blank page to the application
      PageList.AddNewPage("New blank page");
      // Copy the API to the same page
      apiPage.performActionFromEditor("copy", "changedName", "Page1", "Page1");
      // Copy the API to a different page
      apiPage.performActionFromEditor("copy", "secondApi", "Page1", "Page2");
    });

    it("2. Validate moving & deleting API from editor", () => {
      // Create a new application
      homePage.NavigateToHome();
      homePage.CreateNewApplication();
      // Create first API
      apiPage.CreateApi("ApiToBeMoved", "GET");
      apiPage.CreateApi("ApiNotToBeMoved", "GET");
      // Having only one page in the app, check if the API is moved to the same page
      apiPage.performActionFromEditor("move", "ApiToBeMoved", "Page1", "Page1");
      // Add a new blank page to the application
      PageList.AddNewPage("New blank page");
      // Move the API to a different page & check if the source page does not have the API anymore
      apiPage.performActionFromEditor("move", "ApiToBeMoved", "Page1", "Page2");
      apiPage.performActionFromEditor("move", "ApiToBeMoved", "Page2", "Page1");
      apiPage.deleteAPIFromEditor("ApiToBeMoved", "Page1");
    });

    it("3. Validate whether correct tab opens up after clicking on link from logs", () => {
      // Create a new application
      homePage.NavigateToHome();
      homePage.CreateNewApplication();
      for (let i = 0; i < 4; i++) {
        apiPage.CreateApi(``, "GET");
      }
      debuggerHelper.OpenDebugger();
      //Navigate to the "Logs" tab in the debugger
      debuggerHelper.ClickLogsTab();
      // Click on the entity link in the log entry at index 2
      debuggerHelper.ClicklogEntityLink(false, 2);
      // Assert that the correct tab ("Api3") opens
      FileTabs.assertActiveTab("Api3");
    });

    it("4. Validate whether closed tab opens up after clicking on link from logs", () => {
      // Close all the tabs (Api1 to Api4)
      for (let i = 1; i < 5; i++) {
        FileTabs.closeTab(`Api${i}`);
      }
      // Switch to the "UI" segment in the page left pane
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      debuggerHelper.OpenDebugger();
      // Navigate to the "Logs" tab in the debugger
      debuggerHelper.ClickLogsTab();
      // Click on the entity link in the log entry at index 1
      debuggerHelper.ClicklogEntityLink(false, 1);
      // Assert that the correct tab ("Api2") reopens
      FileTabs.assertActiveTab("Api2");
    });
  },
);
