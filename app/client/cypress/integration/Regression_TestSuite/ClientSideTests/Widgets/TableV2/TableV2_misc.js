const dsl = require("../../../../../fixtures/tableV2NewDsl.json");
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";

const table = ObjectsRegistry.TableV2;

describe("Table Widget V2 row multi select validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("tests bug 20663 TypeError: Cannot read properties of undefined", function() {
    cy.openPropertyPane("tablewidgetv2");
    cy.get(
      ".tablewidgetv2-primarycolumn-list div[data-rbd-draggable-id='id'] input[type=text]",
    ).clear();
    cy.get(
      ".tablewidgetv2-primarycolumn-list div[data-rbd-draggable-id='id'] input[type=text]",
      // eslint-disable-next-line prettier/prettier
    ).type("{{}{{}appsmith{}}{}}");
    cy.get(table._tableRow(0, 0)).should("exist");
  });
});
