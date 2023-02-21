const dsl = require("../../../../../fixtures/tableV2NewDsl.json");
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";

const table = ObjectsRegistry.TableV2;

describe("tests bug 20663 TypeError: Cannot read properties of undefined", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("when the column label value is a valid string should show the evaluated string", function() {
    cy.openPropertyPane("tablewidgetv2");
    cy.get(
      ".tablewidgetv2-primarycolumn-list div[data-rbd-draggable-id='id'] input[type=text]",
    ).clear();
    cy.get(
      ".tablewidgetv2-primarycolumn-list div[data-rbd-draggable-id='id'] input[type=text]",
      // eslint-disable-next-line prettier/prettier
    ).type("{{}{{}appsmith.mode{}}{}}");
    cy.get(".tableWrap .thead .tr div[role='columnheader']:first-child").should(
      "contain.text",
      "EDIT",
    );
  });

  it("when the column label value is a boolean replace column name with default column name", function() {
    cy.openPropertyPane("tablewidgetv2");
    cy.get(
      ".tablewidgetv2-primarycolumn-list div[data-rbd-draggable-id='id'] input[type=text]",
    ).clear();
    cy.get(
      ".tablewidgetv2-primarycolumn-list div[data-rbd-draggable-id='id'] input[type=text]",
      // eslint-disable-next-line prettier/prettier
    ).type("{{}{{}false{}}{}}");
    cy.get(".tableWrap .thead .tr div[role='columnheader']:first-child").should(
      "contain.text",
      "tableColumn",
    );
  });

  it("when the column label value is a number replace column name with default column name", function() {
    cy.openPropertyPane("tablewidgetv2");
    cy.get(
      ".tablewidgetv2-primarycolumn-list div[data-rbd-draggable-id='id'] input[type=text]",
    ).clear();
    cy.get(
      ".tablewidgetv2-primarycolumn-list div[data-rbd-draggable-id='id'] input[type=text]",
      // eslint-disable-next-line prettier/prettier
    ).type("{{}{{}0{}}{}}");
    cy.get(".tableWrap .thead .tr div[role='columnheader']:first-child").should(
      "contain.text",
      "tableColumn",
    );

    cy.get(
      ".tablewidgetv2-primarycolumn-list div[data-rbd-draggable-id='id'] input[type=text]",
    ).clear();
    cy.get(
      ".tablewidgetv2-primarycolumn-list div[data-rbd-draggable-id='id'] input[type=text]",
      // eslint-disable-next-line prettier/prettier
    ).type("{{}{{}982{}}{}}");
    cy.get(".tableWrap .thead .tr div[role='columnheader']:first-child").should(
      "contain.text",
      "tableColumn",
    );
  });

  it("when the column label value is an object replace column name with default column name", function() {
    cy.openPropertyPane("tablewidgetv2");
    cy.get(
      ".tablewidgetv2-primarycolumn-list div[data-rbd-draggable-id='id'] input[type=text]",
    ).clear();
    cy.get(
      ".tablewidgetv2-primarycolumn-list div[data-rbd-draggable-id='id'] input[type=text]",
      // eslint-disable-next-line prettier/prettier
    ).type("{{}{{}appsmith{}}{}}");
    cy.get(".tableWrap .thead .tr div[role='columnheader']:first-child").should(
      "contain.text",
      "tableColumn",
    );
  });

  it("when the column label value is undefined replace column name with default column name", function() {
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
