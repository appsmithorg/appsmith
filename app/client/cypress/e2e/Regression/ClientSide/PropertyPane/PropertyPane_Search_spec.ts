import {
  agHelper,
  entityExplorer,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe("Property Pane Search", { tags: ["@tag.PropertyPane"] }, function () {
  before(() => {
    agHelper.AddDsl("swtchTableV2Dsl");
  });

  it("1. Verify if the search Input is getting focused when a widget is selected", function () {
    EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);

    // Initially the search input will only be soft focused
    // We need to press Enter to properly focus it
    agHelper.AssertElementFocus(propPane._propertyPaneSearchInput);
    agHelper.PressEnter();
    agHelper.AssertElementFocus(propPane._propertyPaneSearchInput);

    // Pressing Escape should soft focus the search input
    agHelper.PressEscape();
    agHelper.AssertElementFocus(propPane._propertyPaneSearchInput);

    // Opening a panel should focus the search input
    propPane.OpenTableColumnSettings("name");
    agHelper.AssertElementFocus(propPane._propertyPaneSearchInput);

    // Opening some other widget and then going back to the initial widget should soft focus the search input that is inside a panel
    EditorNavigation.SelectEntityByName("Switch1", EntityType.Widget);
    EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
    agHelper.AssertElementFocus(propPane._propertyPaneSearchInput);

    // Going out of the panel should soft focus the search input
    propPane.NavigateBackToPropertyPane();
    agHelper.AssertElementFocus(propPane._propertyPaneSearchInput);
  });

  it("2. Search for Properties", function () {
    // Search for a property inside CONTENT tab
    propPane.Search("visible");
    propPane.AssertIfPropertyOrSectionExists("general", "CONTENT", "visible");

    // Search for a property inside style tab
    propPane.Search("text color");
    propPane.AssertIfPropertyOrSectionExists("color", "STYLE", "textcolor");

    // search for a camel case property
    propPane.Search("on row selected");
    propPane.AssertIfPropertyOrSectionExists(
      "rowselection",
      "CONTENT",
      "onrowselected",
    );

    // search for another variation of camel case property
    propPane.Search("onSort");
    propPane.AssertIfPropertyOrSectionExists("sorting", "CONTENT", "onsort");
  });

  it("3. Search for Sections", function () {
    // Search for a section inside CONTENT tab
    propPane.Search("general");
    propPane.AssertIfPropertyOrSectionExists("general", "CONTENT");

    // Search for a section inside style tab
    propPane.Search("text formaTTing");
    propPane.AssertIfPropertyOrSectionExists("textformatting", "STYLE");

    agHelper.ClearTextField(propPane._propertyPaneSearchInput);
  });

  it("4. Search for Properties inside a panel", function () {
    propPane.OpenTableColumnSettings("name");

    // Search for a property inside CONTENT tab
    propPane.Search("Visible");
    propPane.AssertIfPropertyOrSectionExists("general", "CONTENT", "visible");

    // Search for a property inside style tab
    propPane.Search("text Color");
    propPane.AssertIfPropertyOrSectionExists("color", "STYLE", "textcolor");
  });

  it("5. Search for Sections inside a panel", function () {
    // Search for a section inside CONTENT tab
    propPane.Search("DATA");
    propPane.AssertIfPropertyOrSectionExists("data", "CONTENT");

    // Search for a section inside style tab
    propPane.Search("color");
    propPane.AssertIfPropertyOrSectionExists("color", "STYLE");
  });

  it("6. Search for gibberish and verify if empty results message is shown", function () {
    // Searching Gibberish inside a panel
    propPane.Search("pigglywiggly");
    agHelper.AssertElementExist(propPane._propertyPaneEmptySearchResult);

    // Searching Gibberish inside main property panel
    propPane.NavigateBackToPropertyPane();
    propPane.Search("pigglywiggly");
    agHelper.AssertElementExist(propPane._propertyPaneEmptySearchResult);
  });

  it("7. Verify behaviour with Dynamically hidden properties inside search results", function () {
    // Search for a Section with Dynamically hidden properties
    propPane.Search("pagination");
    propPane.AssertIfPropertyOrSectionExists("pagination", "CONTENT");
    // Do the operation so that the dymnamic property is visible
    propPane.TogglePropertyState("Server side pagination", "On");
    // Verify if the property is visible
    propPane.AssertIfPropertyOrSectionExists(
      "pagination",
      "CONTENT",
      "onpagechange",
    );

    // Do the operation so that the dymnamic property is hidden again
    propPane.TogglePropertyState("Server side pagination", "Off");
    // Verify whether the property is hidden
    agHelper.AssertElementAbsence(".t--property-control-onpagechange");
  });

  it("8. Verify the search works even if the section is collapsed initially", function () {
    EditorNavigation.SelectEntityByName("Switch1", EntityType.Widget);
    // Collapse All the sections both in CONTENT and STYLE tabs
    propPane.ToggleSection("label");
    propPane.ToggleSection("general");
    propPane.ToggleSection("events");
    propPane.MoveToTab("Style");
    propPane.ToggleSection("labelstyles");
    propPane.ToggleSection("color");

    // Search for sections & properties
    propPane.Search("events");
    propPane.AssertIfPropertyOrSectionExists("events", "CONTENT");

    propPane.Search("visible");
    propPane.AssertIfPropertyOrSectionExists("general", "CONTENT", "visible");

    propPane.Search("color");
    propPane.AssertIfPropertyOrSectionExists("color", "STYLE");

    propPane.Search("emphasis");
    propPane.AssertIfPropertyOrSectionExists(
      "labelstyles",
      "STYLE",
      "emphasis",
    );
  });

  it("9. Verify the search input clears when another widget is selected", function () {
    propPane.Search("visible");
    propPane.AssertSearchInputValue("visible");

    EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
    propPane.AssertSearchInputValue("");
  });

  // Ensuring a bug won't come back
  it("10. Verify searching for properties inside the same section one after the other works", function () {
    // Search for a property
    propPane.Search("onsort");
    propPane.AssertIfPropertyOrSectionExists("sorting", "CONTENT", "onsort");

    // Search for another property in the same section
    propPane.Search("column sorting");
    propPane.AssertIfPropertyOrSectionExists(
      "sorting",
      "CONTENT",
      "columnsorting",
    );

    // Search for the same section name and verify all the properties under it are visible
    propPane.Search("sorting");
    propPane.AssertIfPropertyOrSectionExists("sorting", "CONTENT", "onsort");
    propPane.AssertIfPropertyOrSectionExists(
      "sorting",
      "CONTENT",
      "columnsorting",
    );
  });
});
