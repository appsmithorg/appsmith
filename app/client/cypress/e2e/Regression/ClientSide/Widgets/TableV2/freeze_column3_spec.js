import { PROPERTY_SELECTOR } from "../../../../../locators/WidgetLocators";
import { TABLE_DATA_DYNAMIC } from "../../../../../support/Constants";
import * as _ from "../../../../../support/Objects/ObjectsCore";
const commonlocators = require("../../../../../locators/commonlocators.json");

describe(
  "Server-side pagination when turned on test of re-ordering columns",
  { tags: ["@tag.All", "@tag.Table", "@tag.Binding"] },
  () => {
    before(() => {
      cy.dragAndDropToCanvas(_.draggableWidgets.TABLE, { x: 500, y: 200 });
      _.propPane.EnterJSContext("Table data", TABLE_DATA_DYNAMIC);
      cy.get(commonlocators.serverSidePaginationCheckbox).click({
        force: true,
      });
    });
    it("3.1 Re-order column", () => {
      cy.dragAndDropColumn("productName", "id");

      // Check if product name is at first position
      cy.get("[data-header]").first().should("contain.text", "productName");

      // Check if ProductName column is at the top in property pane tableData
      cy.get(PROPERTY_SELECTOR.tableColumnNames)
        .first()
        .should("have.value", "productName");
    });

    it("3.2 Freeze column and re-order unfrozen columns", () => {
      /**
       * Scenario
       * 1. Check if frozen column cannot be dragged
       * 2. Freeze column and then re-order columns
       */

      // =========================== Scenario 1 ===========================
      cy.freezeColumnFromDropdown("productName", "left");
      cy.get('[data-header="productName"]').should(
        "not.have.attr",
        "draggable",
      );

      // =========================== Scenario 2 ===========================
      cy.dragAndDropColumn("id", "email");

      cy.get("[data-header]").eq(1).should("contain.text", "email");

      cy.get(PROPERTY_SELECTOR.tableColumnNames)
        .eq(1)
        .should("have.value", "email");
    });

    it("3.3 Post resizing column, columns can be reordered", () => {
      // Resize orderAmount column:
      cy.resizeColumn("orderAmount", 100);

      cy.dragAndDropColumn("id", "orderAmount");

      cy.get("[data-header]").last().should("contain.text", "id");

      cy.get(PROPERTY_SELECTOR.tableColumnNames)
        .last()
        .should("have.value", "id");
    });

    it("3.4 Post hiding column, columns can be reordered", () => {
      // Freeze column:
      cy.freezeColumnFromDropdown("email", "right");

      cy.hideColumn("userName");

      cy.dragAndDropColumn("orderAmount", "id");

      // Check if orderAmount is at 3rd position
      cy.get("[data-header]").eq(2).should("contain.text", "orderAmount");

      // Check if id column is at the top in property pane tableData
      cy.get(PROPERTY_SELECTOR.tableColumnNames)
        .eq(2)
        .should("have.value", "orderAmount");

      // Check if hidden column is above right frozen column:
      cy.get(PROPERTY_SELECTOR.tableColumnNames)
        .eq(3)
        .should("have.value", "userName");
    });

    it("3.5 Post unfreezing column, columns can be reordered", () => {
      cy.freezeColumnFromDropdown("productName", "left");

      cy.dragAndDropColumn("productName", "id");

      cy.get("[data-header]").eq(1).should("contain.text", "productName");

      cy.get(PROPERTY_SELECTOR.tableColumnNames)
        .eq(1)
        .should("have.value", "productName");
    });
  },
);
