import {
  getWidgetSelector,
  PROPERTY_SELECTOR,
  WIDGET,
} from "../../../../../locators/WidgetLocators";
import { TABLE_DATA } from "../../../../../support/Constants";
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";

const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const agHelper = ObjectsRegistry.AggregateHelper;

describe("1. Check column freeze and unfreeze mechanism in canavs mode", () => {
  before(() => {
    cy.dragAndDropToCanvas(WIDGET.TABLE, { x: 200, y: 200 });
    cy.dragAndDropToCanvas(WIDGET.TEXT, { x: 200, y: 600 });
    cy.openPropertyPane(WIDGET.TEXT);
    cy.updateCodeInput(
      PROPERTY_SELECTOR.text,
      `{{JSON.stringify({
          step: Table1.primaryColumns.step.sticky,
          status: Table1.primaryColumns.status.sticky,
          task: Table1.primaryColumns.task.sticky,
          action: Table1.primaryColumns.action.sticky,
      }, null ,2)}}`,
    );
  });
  after(() => {
    cy.wait(1000);
    cy.get(widgetsPage.tableWidgetV2).then(($elem) => {
      if ($elem) {
        cy.openPropertyPane(WIDGET.TABLE);
        cy.deleteWidget(widgetsPage.tableWidgetV2);
      }
    });
  });
  describe("1.1 Column freeze and unfreeze testing via propertypane", () => {
    it("1.1.1 Freeze column to left", () => {
      cy.openPropertyPane(WIDGET.TABLE);
      cy.openFieldConfiguration("step");
      cy.get(".t--property-control-columnfreeze .t--button-group-left").click({
        force: true,
      });
      cy.checkIfColumnIsFrozenViaCSS("0", "0");

      cy.get(getWidgetSelector(WIDGET.TEXT)).should(
        "contain.text",
        '"step": "left"',
      );
    });

    it("1.1.2 Freeze column to right", () => {
      cy.get(commonlocators.editPropBackButton).click();
      cy.wait(1000);
      cy.openFieldConfiguration("action");
      cy.get(".t--property-control-columnfreeze .t--button-group-right").click({
        force: true,
      });
      // Check if the first cell has position sticky:
      cy.checkIfColumnIsFrozenViaCSS("0", "3");

      cy.get(getWidgetSelector(WIDGET.TEXT)).should(
        "contain.text",
        '"action": "right"',
      );
    });

    it("1.1.3 unFrezee an existing frozen column", () => {
      cy.get(commonlocators.editPropBackButton).click();
      cy.wait(1000);
      cy.get(".tablewidgetv2-primarycolumn-list > div")
        .last()
        .then(($elem) => {
          cy.wrap($elem)
            .find(".t--edit-column-btn")
            .last()
            .click({ force: true });
        });
      cy.get(".t--property-control-columnfreeze .t--button-group-").click({
        force: true,
      });
      // Check if the first cell has position sticky:
      cy.getTableV2DataSelector("0", "3").then((selector) => {
        cy.get(selector).should("not.have.css", "position", "sticky");
      });
      cy.get(getWidgetSelector(WIDGET.TEXT)).should(
        "not.contain.text",
        '"action": "right"',
      );
    });

    it("1.1.4 Check column is frozen in page mode", () => {
      cy.PublishtheApp();
      // Check if the first cell has position sticky:
      cy.checkIfColumnIsFrozenViaCSS("0", "0");

      cy.get(getWidgetSelector(WIDGET.TEXT)).should(
        "contain.text",
        '"step": "left"',
      );
      cy.goToEditFromPublish();
    });
  });

  describe("1.2 Column freeze and unfreeze testing via dropdown", () => {
    it("1.2.1 Check if column freeze for user mode is enabled", () => {
      cy.openPropertyPane(WIDGET.TABLE);

      cy.get(
        ".t--property-control-allowcolumnfreeze .bp3-switch input[type='checkbox']",
      ).should("be.checked");

      cy.get(`[role="columnheader"] .header-menu .bp3-popover2-target`)
        .first()
        .click({
          force: true,
        });

      cy.get(".bp3-menu")
        .contains("Freeze column left")
        .then(($elem) => {
          cy.get($elem).parent().should("not.have.class", "bp3-disabled");
        });

      // Check in publish mode.
      cy.PublishtheApp();
      cy.get(`[role="columnheader"] .header-menu .bp3-popover2-target`)
        .first()
        .click({
          force: true,
        });

      cy.get(".bp3-menu")
        .contains("Freeze column left")
        .then(($elem) => {
          cy.get($elem).parent().should("not.have.class", "bp3-disabled");
        });
      cy.goToEditFromPublish();
    });

    it("1.2.2 Check if column is freezing in the edit mode", () => {
      cy.freezeColumnFromDropdown("step", "left");
      cy.checkColumnPosition("step", 0);

      cy.freezeColumnFromDropdown("step", "left");
      cy.checkIfColumnIsFrozenViaCSS("0", "0");

      cy.freezeColumnFromDropdown("action", "left");
      cy.checkIfColumnIsFrozenViaCSS("0", "1");
    });

    it("1.2.3 Check if column can be unfrozen from dropdown", () => {
      cy.freezeColumnFromDropdown("step", "left");
      /**
       * When column is unfrozen,
       * check the column position, it goes after the last frozen coumn from left or
       * before the first right frozen column:
       * */

      cy.checkColumnPosition("step", 1);

      /**
       * Last column unfrozen should remain in the same position after unfreezing
       */
      cy.freezeColumnFromDropdown("action", "left");
      cy.checkColumnPosition("action", 0);
    });

    it("1.2.4 Check if existing left frozen coumn can be right frozen", () => {
      cy.freezeColumnFromDropdown("action", "left");
      cy.checkColumnPosition("action", 0);

      // freeze above column to right;
      cy.freezeColumnFromDropdown("action", "right");
      cy.checkIfColumnIsFrozenViaCSS("0", "3");
      cy.checkColumnPosition("action", 3);
    });

    it("1.2.5 Check if existing right frozen column can be frozen to left", () => {
      cy.freezeColumnFromDropdown("action", "left");
      cy.checkIfColumnIsFrozenViaCSS("0", "0");
      cy.checkColumnPosition("action", 0);
    });

    it("1.2.6 Check if column freeze for user mode is disabled", () => {
      cy.openPropertyPane(WIDGET.TABLE);
      cy.get(
        ".t--property-control-allowcolumnfreeze .bp3-switch input[type='checkbox']",
      ).click({
        force: true,
      });

      cy.get(
        ".t--property-control-allowcolumnfreeze .bp3-switch input[type='checkbox']",
      ).should("not.be.checked");

      cy.get(`[role="columnheader"] .header-menu .bp3-popover2-target`)
        .first()
        .click({
          force: true,
        });

      cy.get(".bp3-menu")
        .contains("Freeze column left")
        .should("have.class", "bp3-disabled");

      // Check in publish mode.
      cy.PublishtheApp();
      cy.get(`[role="columnheader"] .header-menu .bp3-popover2-target`)
        .first()
        .click({
          force: true,
        });

      cy.get(".bp3-menu")
        .contains("Freeze column left")
        .should("have.class", "bp3-disabled");

      cy.goToEditFromPublish();
    });
  });
});

describe("2. Check column freeze and unfreeze mechanism in page mode", () => {
  before(() => {
    cy.dragAndDropToCanvas(WIDGET.TABLE, { x: 200, y: 200 });
    cy.openPropertyPane(WIDGET.TABLE);
    cy.PublishtheApp();
  });
  describe("2.1 Column freeze and unfreeze testing with 0 pre-frozen columns", () => {
    beforeEach(() => {
      agHelper.RestoreLocalStorageCache();
    });

    afterEach(() => {
      agHelper.SaveLocalStorageCache();
    });
    it("2.1.1 Freeze Columns left", () => {
      cy.freezeColumnFromDropdown("step", "left");
      cy.checkIfColumnIsFrozenViaCSS("0", "0");
      cy.checkColumnPosition("step", 0);
      cy.checkLocalColumnOrder(["step"], "left");

      cy.freezeColumnFromDropdown("action", "left");
      cy.checkIfColumnIsFrozenViaCSS("0", "1");
      cy.checkColumnPosition("action", 1);
      cy.checkLocalColumnOrder(["step", "action"], "left");
    });

    it("2.1.2 Freeze Columns right", () => {
      cy.freezeColumnFromDropdown("status", "right");
      cy.checkIfColumnIsFrozenViaCSS("0", "3");
      cy.checkColumnPosition("status", 3);
      cy.checkLocalColumnOrder(["status"], "right");
    });

    it("2.1.3 Freeze existing left column to right", () => {
      cy.freezeColumnFromDropdown("step", "right");
      cy.checkIfColumnIsFrozenViaCSS("0", "2");
      cy.checkColumnPosition("step", 2);
      cy.checkLocalColumnOrder(["step", "status"], "right");
    });

    it("2.1.3 Freeze existing right column to left", () => {
      cy.freezeColumnFromDropdown("status", "left");
      cy.checkIfColumnIsFrozenViaCSS("0", "1");
      cy.checkColumnPosition("status", 1);
      cy.checkLocalColumnOrder(["action", "status"], "left");
    });

    it("2.1.4 Unfreeze existing column", () => {
      cy.freezeColumnFromDropdown("status", "left");
      cy.checkColumnPosition("status", 1);
      cy.checkLocalColumnOrder(["action"], "left");

      cy.freezeColumnFromDropdown("action", "left");
      cy.checkColumnPosition("action", 0);
      cy.checkLocalColumnOrder([], "left");

      cy.freezeColumnFromDropdown("step", "right");
      cy.checkColumnPosition("step", 3);
      cy.checkLocalColumnOrder([], "right");
      cy.goToEditFromPublish();
    });
  });
  describe("2.2 Column freeze and unfreeze testing with multiple pre-frozen columns", () => {
    beforeEach(() => {
      agHelper.RestoreLocalStorageCache();
    });

    afterEach(() => {
      agHelper.SaveLocalStorageCache();
    });
    it("2.2.1 Freeze column left", () => {
      // Freeze additional column in editor mode
      cy.freezeColumnFromDropdown("action", "left");
      cy.checkColumnPosition("action", 0);

      cy.freezeColumnFromDropdown("step", "right");
      cy.checkColumnPosition("step", 3);

      cy.PublishtheApp();

      // User frozen columns
      cy.freezeColumnFromDropdown("status", "left");
      cy.checkColumnPosition("status", 1);
      cy.checkIfColumnIsFrozenViaCSS("0", "1");
      cy.checkLocalColumnOrder(["action", "status"], "left");
    });

    it("2.2.2 Freeze developer left frozen column to right", () => {
      cy.freezeColumnFromDropdown("action", "right");
      cy.checkColumnPosition("action", 2);
      cy.checkIfColumnIsFrozenViaCSS("0", "2");
      cy.checkLocalColumnOrder(["status"], "left");
      cy.checkLocalColumnOrder(["action", "step"], "right");
    });

    it("2.2.3 Freeze developer right frozen column to left", () => {
      cy.freezeColumnFromDropdown("step", "left");
      cy.checkColumnPosition("step", 1);
      cy.checkIfColumnIsFrozenViaCSS("0", "1");
      cy.checkLocalColumnOrder(["status", "step"], "left");
    });

    it("2.2.4 Unfreeze columns by developers", () => {
      agHelper.ClearLocalStorageCache();
      cy.reload();
      cy.wait(1000);

      cy.freezeColumnFromDropdown("action", "left");
      cy.checkColumnPosition("action", 0);
      cy.checkLocalColumnOrder([], "left");

      cy.freezeColumnFromDropdown("step", "right");
      cy.checkColumnPosition("step", 3);
      cy.checkLocalColumnOrder([], "right");
      cy.goToEditFromPublish();
    });
  });

  describe("2.3 Hiding frozen columns", () => {
    it("2.3.1 Hide left frozen column and check it's position is before right frozen columns", () => {
      cy.openPropertyPane(WIDGET.TABLE);
      cy.hideColumn("action");
      cy.getTableV2DataSelector("0", "2").then((selector) => {
        cy.get(selector).should("have.class", "hidden-cell");
      });
      // Now check if the column next to this hidden column is right frozen
      cy.checkIfColumnIsFrozenViaCSS("0", "3");
    });

    it("2.3.2 Check if the hidden frozen column comes back to it's original frozen position", () => {
      cy.showColumn("action");
      cy.checkColumnPosition("action", 0);
      cy.checkIfColumnIsFrozenViaCSS("0", "0");
    });

    it("2.3.3 Hide and unhide right frozen column", () => {
      cy.hideColumn("step");
      cy.getTableV2DataSelector("0", "3").then((selector) => {
        cy.get(selector).should("have.class", "hidden-cell");
      });
      cy.showColumn("step");
      cy.checkColumnPosition("step", 3);
      cy.checkIfColumnIsFrozenViaCSS("0", "3");
    });

    it("2.3.4 Hide and unhide frozen columns with existing frozen columns", () => {
      /**
       * At this point: action is left frozen and step is right frozen
       * Adding one more left frozen column
       */
      cy.freezeColumnFromDropdown("task", "left");

      // Hide and unhide one left frozen column and then right frozen column
      cy.hideColumn("task");
      cy.getTableV2DataSelector("0", "2").then((selector) => {
        cy.get(selector).should("have.class", "hidden-cell");
      });
      cy.hideColumn("step");
      cy.getTableV2DataSelector("0", "3").then((selector) => {
        cy.get(selector).should("have.class", "hidden-cell");
      });

      cy.showColumn("task");
      cy.checkColumnPosition("task", 1);
      cy.checkIfColumnIsFrozenViaCSS("0", "1");
      cy.showColumn("step");
      cy.checkColumnPosition("step", 3);
      cy.checkIfColumnIsFrozenViaCSS("0", "3");
    });
  });
});
describe.only("3. Server-side pagination when turned on test of re-ordering columns", () => {
  before(() => {
    cy.dragAndDropToCanvas(WIDGET.TABLE, { x: 500, y: 200 });
    cy.openPropertyPane(WIDGET.TABLE);
    cy.updateCodeInput(PROPERTY_SELECTOR.tableData, TABLE_DATA);
    cy.get(commonlocators.serverSidePaginationCheckbox).click({ force: true });
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
    cy.get('[data-header="productName"]').should("not.have.attr", "draggable");

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
});
