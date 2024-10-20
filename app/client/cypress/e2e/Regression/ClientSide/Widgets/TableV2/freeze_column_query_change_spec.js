import {
  PROPERTY_SELECTOR,
  WIDGET,
} from "../../../../../locators/WidgetLocators";
import {
  TABLE_DATA_DYNAMIC,
  TABLE_DATA_STATIC,
} from "../../../../../support/Constants";
import * as _ from "../../../../../support/Objects/ObjectsCore";

const widgetsPage = require("../../../../../locators/Widgets.json");

describe(
  "1. Check frozen common and/or custom columns retain position on query change",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  () => {
    before(() => {
      cy.dragAndDropToCanvas(WIDGET.TABLE, { x: 600, y: 200 });
      cy.wait(2000);
      cy.openPropertyPane(WIDGET.TABLE);
      _.propPane.EnterJSContext("Table data", TABLE_DATA_STATIC);
    });

    it("1.1 Check if common frozen columns retain position", () => {
      // Freeze the common column: id
      cy.freezeColumnFromDropdown("id", "right");

      //Change the table data:
      cy.openPropertyPane(WIDGET.TABLE);
      _.propPane.EnterJSContext("Table data", TABLE_DATA_DYNAMIC);

      //Check the id column is still frozen to the right:
      cy.wait(500);
      cy.checkColumnPosition("id", 4);
      cy.freezeColumnFromDropdown("id", "right");
    });

    it("1.2 Check if custom frozen columns retain position", () => {
      // Add a custom column
      cy.get(widgetsPage.addColumn).scrollIntoView();
      cy.get(widgetsPage.addColumn).should("be.visible").click({ force: true });
      cy.wait(300);
      cy.freezeColumnFromDropdown("customColumn1", "right");

      // Change the table data:
      cy.openPropertyPane(WIDGET.TABLE);
      cy.updateCodeInput(PROPERTY_SELECTOR.tableData, TABLE_DATA_STATIC);

      //Check the id column is still frozen to the right:
      cy.checkColumnPosition("customColumn1", 5);
    });

    it("1.3 Check if the custom + common columns retain their positon", () => {
      cy.wait(500);
      // Freeze the common column:
      cy.freezeColumnFromDropdown("id", "right");

      // Expect id should come before customColumn1 and both should be frozen:
      cy.checkColumnPosition("id", 3);
      cy.checkColumnPosition("customColumn1", 4);

      // Change table data:
      cy.updateCodeInput(PROPERTY_SELECTOR.tableData, TABLE_DATA_DYNAMIC);

      // Re-check the frozen column order:
      cy.checkColumnPosition("id", 3);
      cy.checkColumnPosition("customColumn1", 4);
    });

    it("1.4 Check if frozen column retains its position and unfrozen goes at the first position", () => {
      // Freeze the common column:
      cy.freezeColumnFromDropdown("id", "right");

      // Change table data:
      cy.updateCodeInput(PROPERTY_SELECTOR.tableData, TABLE_DATA_STATIC);

      cy.wait(500);

      // Re-check the frozen column order:
      cy.checkColumnPosition("id", 0);
      cy.checkColumnPosition("customColumn1", 4);
    });

    it("1.5 Check if the order of the forzen columns remains the same", () => {
      cy.freezeColumnFromDropdown("id", "right");

      cy.updateCodeInput(PROPERTY_SELECTOR.tableData, TABLE_DATA_DYNAMIC);

      cy.wait(500);

      cy.checkColumnPosition("id", 4);
      cy.checkColumnPosition("customColumn1", 5);

      // Check the order for left frozen columns:
      cy.freezeColumnFromDropdown("id", "left");
      cy.freezeColumnFromDropdown("customColumn1", "left");

      cy.updateCodeInput(PROPERTY_SELECTOR.tableData, TABLE_DATA_STATIC);

      cy.wait(500);

      cy.checkColumnPosition("id", 0);
      cy.checkColumnPosition("customColumn1", 1);

      // Check if the common unfrozen column comes after the left frozen column
      cy.freezeColumnFromDropdown("customColumn1", "left");
      cy.dragAndDropColumn("customColumn1", "action");

      cy.updateCodeInput(PROPERTY_SELECTOR.tableData, TABLE_DATA_DYNAMIC);

      cy.wait(500);

      cy.checkColumnPosition("id", 0);
      cy.checkColumnPosition("customColumn1", 1);
    });
  },
);
