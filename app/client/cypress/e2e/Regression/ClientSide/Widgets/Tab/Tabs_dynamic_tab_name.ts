import {
  agHelper,
  locators,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Test to check if user name the tab dynamically",
  { tags: ["@tag.Widget", "@tag.Tab"] },
  () => {
    before(() => {
      agHelper.AddDsl("tabsDsl");
    });
    it("Test to check if user name the tab dynamically", () => {
      EditorNavigation.SelectEntityByName("Tabs1", EntityType.Widget);
      agHelper.AssertElementLength(propPane._tableEditColumnButton, 2);
      propPane.OpenTableColumnSettings("tab2");
      propPane.UpdatePropertyFieldValue("Label", "{{'test Binding'}}");
      agHelper.GetNAssertContains(
        locators._openNavigationTab("test Binding"),
        "test Binding",
      );
      agHelper.GetNClick(locators._openNavigationTab("test Binding"));
    });
  },
);
