import * as _ from "../../../../../support/Objects/ObjectsCore";
import { DEFAULT_COLUMN_NAME } from "../../../../../support/Constants";

describe(
  "tests bug 20663 TypeError: Cannot read properties of undefined",
  { tags: ["@tag.Widget", "@tag.Table"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("tableV2NewDsl");
    });

    it("1. when the column label value is a valid string should show the evaluated string", function () {
      cy.openPropertyPane("tablewidgetv2");
      cy.get(
        ".tablewidgetv2-primarycolumn-list div[data-rbd-draggable-id='id'] input[type=text]",
      ).clear();
      cy.get(
        ".tablewidgetv2-primarycolumn-list div[data-rbd-draggable-id='id'] input[type=text]",
        // For escaping "{" in cypress refer to https://docs.cypress.io/api/commands/type#Arguments
        // eslint-disable-next-line prettier/prettier
      ).type("{{}{{}appsmith.mode{}}{}}");
      cy.contains(
        ".tableWrap .thead .tr div[role='columnheader']:first-child",
        "EDIT",
      );
    });

    it("2. when the column label value is a boolean replace column name with default column name", function () {
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

    it("3. when the column label value is a number replace column name with default column name", function () {
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

    it("4. when the column label value is an object replace column name with default column name", function () {
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

    it("5. when the column label value is undefined replace column name with default column name", function () {
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
  },
);
