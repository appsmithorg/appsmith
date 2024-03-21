import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import {
  agHelper,
  locators,
  entityExplorer,
  propPane,
  draggableWidgets,
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
});
