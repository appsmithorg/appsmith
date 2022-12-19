import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  propPane = ObjectsRegistry.PropertyPane;

describe("Property Pane Search", function() {
  before(() => {
    cy.fixture("swtchTableV2Dsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
  });

  it("1. Verify if the search Input is getting focused when a widget is selected", function() {
    ee.SelectEntityByName("Table1", "Widgets");

    // Initially the search input will only be soft focused
    // We need to press Enter to properly focus it
    agHelper.AssertElementFocus(propPane._propertyPaneSearchInputWrapper);
    agHelper.PressEnter();
    agHelper.AssertElementFocus(propPane._propertyPaneSearchInput);

    // Pressing Escape should soft focus the search input
    agHelper.PressEscape();
    agHelper.AssertElementFocus(propPane._propertyPaneSearchInputWrapper);

    // Opening a panel should focus the search input
    propPane.OpenTableColumnSettings("name");
    agHelper.AssertElementFocus(propPane._propertyPaneSearchInputWrapper);

    // Opening some other widget and then going back to the initial widget should soft focus the search input that is inside a panel
    ee.SelectEntityByName("Switch1", "Widgets");
    ee.SelectEntityByName("Table1", "Widgets");
    agHelper.AssertElementFocus(propPane._propertyPaneSearchInputWrapper);

    // Going out of the panel should soft focus the search input
    propPane.NavigateBackToPropertyPane();
    agHelper.AssertElementFocus(propPane._propertyPaneSearchInputWrapper);
  });

  it("2. Search for Properties", function() {
    // Search for a property inside content tab
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

  it("3. Search for Sections", function() {
    // Search for a section inside content tab
    propPane.Search("general");
    propPane.AssertIfPropertyOrSectionExists("general", "CONTENT");

    // Search for a section inside style tab
    propPane.Search("text formaTTing");
    propPane.AssertIfPropertyOrSectionExists("textformatting", "STYLE");

    // Clear the search input for the next test
    propPane.Search("");
  });

  it("4. Search for Properties inside a panel", function() {
    propPane.OpenTableColumnSettings("name");

    // Search for a property inside content tab
    propPane.Search("Visible");
    propPane.AssertIfPropertyOrSectionExists("general", "CONTENT", "visible");

    // Search for a property inside style tab
    propPane.Search("text Color");
    propPane.AssertIfPropertyOrSectionExists("color", "STYLE", "textcolor");
  });

  it("5. Search for Sections inside a panel", function() {
    // Search for a section inside content tab
    propPane.Search("DATA");
    propPane.AssertIfPropertyOrSectionExists("data", "CONTENT");

    // Search for a section inside style tab
    propPane.Search("color");
    propPane.AssertIfPropertyOrSectionExists("color", "STYLE");
  });

  it("6. Search for gibberish and verify if empty results message is shown", function() {
    // Searching Gibberish inside a panel
    propPane.Search("pigglywiggly");
    agHelper.AssertElementExist(propPane._propertyPaneEmptySearchResult);

    // Searching Gibberish inside main property panel
    propPane.NavigateBackToPropertyPane();
    propPane.Search("pigglywiggly");
    agHelper.AssertElementExist(propPane._propertyPaneEmptySearchResult);
  });

  it("7. Verify behaviour with Dynamically hidden properties inside search results", function() {
    // Search for a Section with Dynamically hidden properties
    propPane.Search("pagination");
    propPane.AssertIfPropertyOrSectionExists("pagination", "CONTENT");
    // Do the operation so that the dymnamic property is visible
    propPane.ToggleOnOrOff("Server Side Pagination", "On");
    // Verify if the property is visible
    propPane.AssertIfPropertyOrSectionExists(
      "pagination",
      "CONTENT",
      "onpagechange",
    );

    // Do the operation so that the dymnamic property is hidden again
    propPane.ToggleOnOrOff("Server Side Pagination", "Off");
    // Verify whether the property is hidden
    agHelper.AssertElementAbsence(".t--property-control-onpagechange");
  });

  it("8. Verify the search works even if the section is collapsed initially", function() {
    ee.SelectEntityByName("Switch1", "Widgets");
    // Collapse All the sections both in CONTENT and STYLE tabs
    propPane.ToggleSection("label");
    propPane.ToggleSection("general");
    propPane.ToggleSection("events");
    propPane.moveToStyleTab();
    propPane.ToggleSection("labelstyles");
    propPane.ToggleSection("color");

    // Search for sections & properties
    propPane.Search("events");
    propPane.AssertIfPropertyOrSectionExists("events", "CONTENT");

    propPane.Search("visible");
    propPane.AssertIfPropertyOrSectionExists("events", "CONTENT", "visible");

    propPane.Search("color");
    propPane.AssertIfPropertyOrSectionExists("color", "STYLE");

    propPane.Search("emphasis");
    propPane.AssertIfPropertyOrSectionExists(
      "labelstyles",
      "STYLE",
      "emphasis",
    );
  });

  it("9. Verify the search input clears when another widget is selected", function() {
    propPane.Search("visible");
    propPane.AssertSearchInputValue("visible");

    ee.SelectEntityByName("Table1", "Widgets");
    propPane.AssertSearchInputValue("");
  });

  // Ensuring a bug won't come back
  it("10. Verify searching for properties inside the same section one after the other works", function() {
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
