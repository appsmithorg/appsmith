import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import {
  agHelper,
  locators,
  entityExplorer,
  propPane,
  draggableWidgets,
  apiPage,
  entityItems,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe("Property Pane Suggestions", { tags: ["@tag.JS"] }, () => {
  before(() => {
    featureFlagIntercept({
      ab_learnability_ease_of_initial_use_enabled: true,
    });
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 200, 200);
  });

  it("1. Should show Property Pane Suggestions on / command & when typing {{}}", () => {
    EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
    propPane.ToggleJSMode("Table data", true);
    propPane.FocusIntoTextField("Table data");
    agHelper.GetElementsNAssertTextPresence(locators._hints, "Add a binding");
    agHelper.GetNClickByContains(locators._hints, "Add a binding");
    propPane.ValidatePropertyFieldValue("Table data", "{{}}");

    entityExplorer.DragDropWidgetNVerify(draggableWidgets.JSONFORM, 600, 400);
    EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
    propPane.ToggleJSMode("Source data", true);
    propPane.FocusIntoTextField("Source data");
    agHelper.GetElementsNAssertTextPresence(locators._hints, "Add a binding");
    agHelper.GetNClickByContains(locators._hints, "Add a binding");
    propPane.ValidatePropertyFieldValue("Source data", "{{}}");
  });

  it("2. Should show `load more` option in case number of queries are more than 5", () => {
    // Create more than 5 apis
    apiPage.CreateApi("Api1", "GET");
    apiPage.CreateApi("Api2", "GET");
    apiPage.CreateApi("Api3", "GET");
    apiPage.CreateApi("Api4", "GET");
    apiPage.CreateApi("Api5", "GET");
    apiPage.CreateApi("Api6", "GET");
    apiPage.CreateApi("Api7", "GET");
    apiPage.CreateApi("Api8", "GET");

    // Navigate to table and open slash menu command
    EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
    propPane.ToggleJSMode("Table data", true);
    propPane.UpdatePropertyFieldValue("Table data", "");
    propPane.FocusIntoTextField("Table data");
    agHelper.GetElementsNAssertTextPresence(locators._hints, "Add a binding");

    // Assert that count of Codemirror-hints is 10, as the whole list is not expanded yet
    agHelper.AssertElementLength(locators._hints_apis, 5);
    agHelper.GetElementsNAssertTextPresence(locators._hints, "Load 3 more");

    // Click on load more to expand all options
    agHelper.GetNClickByContains(locators._hints, "Load 3 more");

    // Assert that all elements are visible now
    agHelper.AssertElementLength(locators._hints_apis, 8);
  });
});
