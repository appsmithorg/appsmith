const dsl = require("../../../../../fixtures/tableV2NewDsl.json");
import { DEFAULT_COLUMN_NAME } from "../../../../../../src/widgets/TableWidgetV2/constants";

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
    cy.contains(
      ".tableWrap .thead .tr div[role='columnheader']:first-child",
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
    cy.contains(
      ".tableWrap .thead .tr div[role='columnheader']:first-child",
      DEFAULT_COLUMN_NAME,
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
    cy.contains(
      ".tableWrap .thead .tr div[role='columnheader']:first-child",
      DEFAULT_COLUMN_NAME,
    );

    cy.get(
      ".tablewidgetv2-primarycolumn-list div[data-rbd-draggable-id='id'] input[type=text]",
    ).clear();
    cy.get(
      ".tablewidgetv2-primarycolumn-list div[data-rbd-draggable-id='id'] input[type=text]",
      // eslint-disable-next-line prettier/prettier
    ).type("{{}{{}982{}}{}}");
    cy.contains(
      ".tableWrap .thead .tr div[role='columnheader']:first-child",
      DEFAULT_COLUMN_NAME,
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
    cy.contains(
      ".tableWrap .thead .tr div[role='columnheader']:first-child",
      DEFAULT_COLUMN_NAME,
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
    cy.contains(
      ".tableWrap .thead .tr div[role='columnheader']:first-child",
      DEFAULT_COLUMN_NAME,
    );
  });
});
