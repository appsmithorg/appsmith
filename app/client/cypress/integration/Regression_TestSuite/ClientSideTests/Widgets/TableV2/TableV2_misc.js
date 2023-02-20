const dsl = require("../../../../../fixtures/tableV2NewDsl.json");
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";

const table = ObjectsRegistry.TableV2;

describe("tests bug 20663 TypeError: Cannot read properties of undefined", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("test bug when the evaluated column label value is an object", function() {
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

  it("test bug when the evaluated column label value is undefined", function() {
    cy.openPropertyPane("tablewidgetv2");
    cy.get(
      ".tablewidgetv2-primarycolumn-list div[data-rbd-draggable-id='id'] input[type=text]",
    ).clear();
    cy.get(
      ".tablewidgetv2-primarycolumn-list div[data-rbd-draggable-id='id'] input[type=text]",
      // eslint-disable-next-line prettier/prettier
    ).type("{{}{{}ap{}}{}}");
    cy.get(table._tableRow(0, 0)).should("exist");
  });
});
