import * as _ from "../../../../../support/Objects/ObjectsCore";
const testdata = require("../../../../../fixtures/testdata.json");

describe("Table Widget V2 Sorting", function () {
  before(() => {
    _.agHelper.AddDsl("tableV2NewDslWithPagination");
  });

  it("verifies that table sorting works for a custom column with computed value even when it is renamed", function () {
    cy.openPropertyPane("tablewidgetv2");
    cy.addColumnV2("customColumn1");
    cy.editColumn("customColumn1");
    cy.updateComputedValueV2(testdata.currentIndex);
    cy.backFromPropertyPanel();

    // Ensure simple sorting for a custom column in working
    // customColumn1 is at index 5 in the table
    cy.sortColumn("customColumn1", "ascending");
    cy.readTableV2data(0, 5).then((data) => {
      expect(data).to.eq("0");
    });
    cy.readTableV2data(1, 5).then((data) => {
      expect(data).to.eq("1");
    });

    cy.sortColumn("customColumn1", "descending");
    cy.readTableV2data(0, 5).then((data) => {
      expect(data).to.eq("9");
    });
    cy.readTableV2data(1, 5).then((data) => {
      expect(data).to.eq("8");
    });

    // Rename customColumn1 to customColumn2
    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("customColumn1");
    cy.get(".t--property-pane-title").click({ force: true });
    cy.get(".t--property-pane-title")
      .type("customColumn2", { delay: 300 })
      .type("{enter}");

    // Ensure that renaming preserves existing data in the table
    cy.readTableV2data(0, 5).then((data) => {
      expect(data).to.eq("9");
    });

    // Ensure ascending/descending sorting works in the table with the renamed column
    cy.sortColumn("customColumn2", "ascending");
    cy.readTableV2data(0, 5).then((data) => {
      expect(data).to.eq("0");
    });
    cy.readTableV2data(1, 5).then((data) => {
      expect(data).to.eq("1");
    });

    cy.sortColumn("customColumn2", "descending");
    cy.readTableV2data(0, 5).then((data) => {
      expect(data).to.eq("9");
    });
    cy.readTableV2data(1, 5).then((data) => {
      expect(data).to.eq("8");
    });
  });
});
