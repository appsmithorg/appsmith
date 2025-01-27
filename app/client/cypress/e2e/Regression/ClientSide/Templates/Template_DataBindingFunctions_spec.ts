import template from "../../../../locators/TemplatesLocators.json";
import {
  agHelper,
  assertHelper,
  dataSources,
  debuggerHelper,
  locators,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

describe(
  "Fork a template to the current app",
  {
    tags: ["@tag.Templates", "@tag.excludeForAirgap"],
  },
  () => {
    it("1. Verify that all data bindings in the template are correctly connected to the corresponding data sources (e.g., APIs, databases) No errors should be seen", () => {
      PageList.AddNewPage("Add page from template");
      agHelper.AssertElementVisibility(template.templateDialogBox);
      agHelper.ContainsNClick("Vehicle Maintenance App");
      agHelper.FailIfErrorToast("INTERNAL_SERVER_ERROR");
      agHelper.GetNClick(template.templateViewForkButton);
      agHelper.WaitUntilToastDisappear("template added successfully");
      assertHelper.AssertNetworkStatus("updateLayout");
      agHelper.WaitUntilAllToastsDisappear();
      EditorNavigation.SelectEntityByName("Home page", EntityType.Page);
      EditorNavigation.SelectEntityByName(
        "Container2CopyCopy",
        EntityType.Widget,
      );
      debuggerHelper.OpenDebugger();
      debuggerHelper.ClickLogsTab();
      debuggerHelper.AssertVisibleErrorMessagesCount(0);
    });

    it("2. Verify button actions, such as submitting forms, navigating to other pages, or calling APIs, and verify the responses", () => {
      PageList.AddNewPage("Add page from template");
      agHelper.AssertElementVisibility(template.templateDialogBox);
      agHelper.ContainsNClick("Vehicle Maintenance App");
      agHelper.FailIfErrorToast("INTERNAL_SERVER_ERROR");
      agHelper.GetNClick(template.templateViewForkButton);
      agHelper.WaitUntilToastDisappear("template added successfully");
      assertHelper.AssertNetworkStatus("updateLayout");

      agHelper.WaitUntilAllToastsDisappear();
      agHelper.RefreshPage();
      EditorNavigation.SelectEntityByName("Container5", EntityType.Widget);
      PageLeftPane.expandCollapseItem("Container1");
      agHelper.ClickButton("Open Menu");
      agHelper.AssertText(locators._menuItem, "text", "Home page", 0);
      agHelper.AssertText(locators._menuItem, "text", "New vehicle", 1);
      agHelper.GetNClick(locators._menuItem, 1);
      agHelper.AssertContains("New vehicle registration");
      EditorNavigation.SelectEntityByName("Home page", EntityType.Page);
      EditorNavigation.SelectEntityByName(
        "Container2CopyCopy",
        EntityType.Widget,
      );
      PageLeftPane.expandCollapseItem("Container2CopyCopy");
      agHelper.ClickButton("Register service");
      agHelper.AssertElementVisibility(locators._modalWrapper);
      debuggerHelper.OpenDebugger();
      debuggerHelper.ClickLogsTab();
      debuggerHelper.AssertVisibleErrorMessagesCount(0);

      EditorNavigation.SelectEntityByName("select_cars", EntityType.Query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders(["vin"]);
      dataSources.AssertQueryResponseHeaders(["make"]);
    });
  },
);
