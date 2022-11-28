import { ObjectsRegistry } from "../../../../support/Objects/Registry";
// const dsl = require("../../../../fixtures/TextTabledsl.json");

const agHelper = ObjectsRegistry.AggregateHelper,
  table = ObjectsRegistry.Table,
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

  it("1. Search for Properties", function() {
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

  it("2. Search for Sections", function() {
    // Search for a section inside content tab
    propPane.search("general");
    assertIfPropertyOrSectionExists("general", "CONTENT");

    // Search for a section inside style tab
    propPane.search("text formatting");
    assertIfPropertyOrSectionExists("textformatting", "STYLE");

    propPane.search("");
  });

  it("3. Search for Properties inside a panel", function() {
    propPane.openTableColumnSettings("name");

    // Search for a property inside content tab
    propPane.search("visible");
    assertIfPropertyOrSectionExists("general", "CONTENT", "visible");

    // Search for a property inside style tab
    propPane.search("text color");
    assertIfPropertyOrSectionExists("color", "STYLE", "textcolor");
  });

  it("4. Search for Sections inside a panel", function() {
    // Search for a section inside content tab
    propPane.search("data");
    assertIfPropertyOrSectionExists("data", "CONTENT");

    // Search for a section inside style tab
    propPane.search("color");
    assertIfPropertyOrSectionExists("color", "STYLE");
  });

  it("5. Search for gibberish and verify if empty results message is shown", function() {
    // Searching Gibberish inside a panel
    propPane.search("pigglywiggly");
    agHelper.AssertElementExist(".t--property-pane-no-search-results");

    // Searching Gibberish inside main property panel
    propPane.NavigateBackToPropertyPane();
    propPane.search("pigglywiggly");
    agHelper.AssertElementExist(".t--property-pane-no-search-results");
  });
});
