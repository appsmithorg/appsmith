import {
  agHelper,
  locators,
  propPane,
  homePage,
  assertHelper,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe("Property Pane Suggestions", { tags: ["@tag.JS"] }, () => {
  before(function () {
    agHelper.ClearLocalStorageCache();
  });

  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });

  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  it("1. Should show Property Pane Suggestions on / command & when typing {{}}", () => {
    homePage.NavigateToHome();
    homePage.ImportApp("PropertyPaneSlashMenuBindings.json");
    assertHelper.WaitForNetworkCall("importNewApplication");

    // Select table and check for slash menu command popup
    EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
    propPane.ToggleJSMode("Table data", true);
    propPane.FocusIntoTextField("Table data");
    agHelper.GetElementsNAssertTextPresence(locators._hints, "Add a binding");
    agHelper.GetNClickByContains(locators._hints, "Add a binding");
    propPane.ValidatePropertyFieldValue("Table data", "{{}}");

    // Select json form widget and check for slash menu command popup
    EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
    propPane.ToggleJSMode("Source data", true);
    propPane.FocusIntoTextField("Source data");
    agHelper.GetElementsNAssertTextPresence(locators._hints, "Add a binding");
    agHelper.GetNClickByContains(locators._hints, "Add a binding");
    propPane.ValidatePropertyFieldValue("Source data", "{{}}");
  });

  it("2. Should show `load more` option in case number of queries are more than 5", () => {
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
