import { ObjectsRegistry } from "../../../../support/Objects/Registry";
// const dsl = require("../../../../fixtures/TextTabledsl.json");

const agHelper = ObjectsRegistry.AggregateHelper,
  locator = ObjectsRegistry.CommonLocators,
  ee = ObjectsRegistry.EntityExplorer,
  propPane = ObjectsRegistry.PropertyPane;

// Checks if the property exists in search results
function assertIfPropertyOrSectionExists(
  section: string,
  tab: "CONTENT" | "STYLE",
  property?: string,
) {
  agHelper.AssertElementExist(
    `.t--property-pane-section-collapse-${section} .t--property-section-tag-${tab}`,
  );
  if (property) agHelper.AssertElementExist(`.t--property-control-${property}`);
}

describe("Property Pane Search", function() {
  before(() => {
    cy.fixture("swtchTableV2Dsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
  });

  it("1. Verify if the search Input is getting focused when a widget is selected", function() {
    ee.SelectEntityByName("Table1", "Widgets");

    // Initially the search input will only be soft focused
    // We need to press Enter so that the search will properly gets focused
    agHelper.PressEnter();
    cy.get(locator._propertyPaneSearchInput).should("be.focused");
    agHelper.PressEscape();
    cy.get(locator._propertyPaneSearchInput).should("not.be.focused");
  });

  it("2. Search for Properties", function() {
    ee.SelectEntityByName("Table1", "Widgets");

    // Search for a property inside content tab
    propPane.search("visible");
    assertIfPropertyOrSectionExists("general", "CONTENT", "visible");

    // Search for a property inside style tab
    propPane.search("text color");
    assertIfPropertyOrSectionExists("color", "STYLE", "textcolor");

    // search for a camel case property
    propPane.search("on row selected");
    assertIfPropertyOrSectionExists("rowselection", "CONTENT", "onrowselected");
  });

  it("3. Search for Sections", function() {
    // Search for a section inside content tab
    propPane.search("general");
    assertIfPropertyOrSectionExists("general", "CONTENT");

    // Search for a section inside style tab
    propPane.search("text formatting");
    assertIfPropertyOrSectionExists("textformatting", "STYLE");

    propPane.search("");
  });

  it("4. Search for Properties inside a panel", function() {
    propPane.openTableColumnSettings("name");

    // Search for a property inside content tab
    propPane.search("visible");
    assertIfPropertyOrSectionExists("general", "CONTENT", "visible");

    // Search for a property inside style tab
    propPane.search("text color");
    assertIfPropertyOrSectionExists("color", "STYLE", "textcolor");
  });

  it("5. Search for Sections inside a panel", function() {
    // Search for a section inside content tab
    propPane.search("data");
    assertIfPropertyOrSectionExists("data", "CONTENT");

    // Search for a section inside style tab
    propPane.search("color");
    assertIfPropertyOrSectionExists("color", "STYLE");
  });

  it("6. Search for gibberish and verify if empty results message is shown", function() {
    // Searching Gibberish inside a panel
    propPane.search("pigglywiggly");
    agHelper.AssertElementExist(".t--property-pane-no-search-results");

    // Searching Gibberish inside main property panel
    propPane.NavigateBackToPropertyPane();
    propPane.search("pigglywiggly");
    agHelper.AssertElementExist(".t--property-pane-no-search-results");
  });

  it("7. Verify behaviour with Dynamically hidden properties", function() {
    // Search for a Section with Dynamically hidden properties
    propPane.search("pagination");
    assertIfPropertyOrSectionExists("pagination", "CONTENT");
    // Do the operation so that the dymnamic property is visible
    propPane.ToggleOnOrOff("Server Side Pagination", "On");
    // Verify if the property is visible
    assertIfPropertyOrSectionExists("pagination", "CONTENT", "onpagechange");

    // Do the operation so that the dymnamic property is hidden again
    propPane.ToggleOnOrOff("Server Side Pagination", "Off");
    // Verify whether the property is hidden
    agHelper.AssertElementAbsence(".t--property-control-onpagechange");
  });

  it("8. Verify the search works even if the section is collapsed initially", function() {
    ee.SelectEntityByName("Switch1", "Widgets");
    // Collapse All the sections both in CONTENT and STYLE tabs
    propPane.toggleSection("label");
    propPane.toggleSection("general");
    propPane.toggleSection("events");
    propPane.moveToStyleTab();
    propPane.toggleSection("labelstyles");
    propPane.toggleSection("color");

    // Search for sections & properties
    propPane.search("events");
    assertIfPropertyOrSectionExists("events", "CONTENT");

    propPane.search("visible");
    assertIfPropertyOrSectionExists("events", "CONTENT", "visible");

    propPane.search("color");
    assertIfPropertyOrSectionExists("color", "STYLE");

    propPane.search("emphasis");
    assertIfPropertyOrSectionExists("labelstyles", "STYLE", "emphasis");
  });

  it("9. Verify the search input clears when another widget is selected", function() {
    propPane.search("visible");
    propPane.assertSearchInputValue("visible");

    ee.SelectEntityByName("Table1", "Widgets");
    propPane.assertSearchInputValue("");
  });
});
