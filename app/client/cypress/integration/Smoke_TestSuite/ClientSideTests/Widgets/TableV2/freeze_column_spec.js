import {
  getWidgetSelector,
  PROPERTY_SELECTOR,
  WIDGET,
} from "../../../../../locators/WidgetLocators";
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";

const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const agHelper = ObjectsRegistry.AggregateHelper;

const readLocalColumnOrder = () => {
  const localColumnOrder =
    window.localStorage.getItem("tableWidgetColumnOrder") || "";
  if (localColumnOrder) {
    const parsedTableConfig = JSON.parse(localColumnOrder);
    if (parsedTableConfig) {
      const tableWidgetId = Object.keys(parsedTableConfig)[0];
      return parsedTableConfig[tableWidgetId];
    }
  }
};

const checkLocalColumnOrder = (expectedOrder, direction) => {
  const tableWidgetOrder = readLocalColumnOrder();
  if (tableWidgetOrder) {
    const {
      leftOrder: observedLeftOrder,
      rightOrder: observedRightOrder,
    } = tableWidgetOrder;
    if (direction === "left") {
      cy.log(expectedOrder);
      expect(expectedOrder).to.be.deep.equal(observedLeftOrder);
    }
    if (direction === "right") {
      expect(expectedOrder).to.be.deep.equal(observedRightOrder);
    }
  }
};

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
      cy.get(".t--property-control-columnfreeze .t--button-tab-left").click({
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
      cy.get(".t--property-control-columnfreeze .t--button-tab-right").click({
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
      cy.get(".t--property-control-columnfreeze .t--button-tab-").click({
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
          cy.get($elem)
            .parent()
            .should("not.have.class", "bp3-disabled");
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
          cy.get($elem)
            .parent()
            .should("not.have.class", "bp3-disabled");
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
    it("2.1.1 Freeze Columns left", () => {
      cy.freezeColumnFromDropdown("step", "left");
      cy.checkIfColumnIsFrozenViaCSS("0", "0");
      cy.checkColumnPosition("step", 0);
      checkLocalColumnOrder(["step"], "left");

      cy.freezeColumnFromDropdown("action", "left");
      cy.checkIfColumnIsFrozenViaCSS("0", "1");
      cy.checkColumnPosition("action", 1);
      checkLocalColumnOrder(["step", "action"], "left");
    });

    it("2.1.2 Freeze Columns right", () => {
      cy.freezeColumnFromDropdown("status", "right");
      cy.checkIfColumnIsFrozenViaCSS("0", "3");
      cy.checkColumnPosition("status", 3);
      checkLocalColumnOrder(["status"], "right");
    });

    it("2.1.3 Freeze existing left column to right", () => {
      cy.freezeColumnFromDropdown("step", "right");
      cy.checkIfColumnIsFrozenViaCSS("0", "2");
      cy.checkColumnPosition("step", 2);
      checkLocalColumnOrder(["step", "status"], "right");
    });

    it("2.1.3 Freeze existing right column to left", () => {
      cy.freezeColumnFromDropdown("status", "left");
      cy.checkIfColumnIsFrozenViaCSS("0", "1");
      cy.checkColumnPosition("status", 1);
      checkLocalColumnOrder(["action", "status"], "left");
    });

    it("2.1.4 Unfreeze existing column", () => {
      cy.freezeColumnFromDropdown("status", "left");
      cy.checkColumnPosition("status", 1);
      checkLocalColumnOrder(["action"], "left");

      cy.freezeColumnFromDropdown("action", "left");
      cy.checkColumnPosition("action", 0);
      checkLocalColumnOrder([], "left");

      cy.freezeColumnFromDropdown("step", "right");
      cy.checkColumnPosition("step", 3);
      checkLocalColumnOrder([], "right");
      cy.goToEditFromPublish();
    });
  });
  describe("2.2 Column freeze and unfreeze testing with multiple pre-frozen columns", () => {
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
      checkLocalColumnOrder(["action", "status"], "left");
    });

    it("2.2.2 Freeze developer left frozen column to right", () => {
      cy.freezeColumnFromDropdown("action", "right");
      cy.checkColumnPosition("action", 2);
      cy.checkIfColumnIsFrozenViaCSS("0", "2");
      checkLocalColumnOrder(["status"], "left");
      checkLocalColumnOrder(["action", "step"], "right");
    });

    it("2.2.3 Freeze developer right frozen column to left", () => {
      cy.freezeColumnFromDropdown("step", "left");
      cy.checkColumnPosition("step", 1);
      cy.checkIfColumnIsFrozenViaCSS("0", "1");
      checkLocalColumnOrder(["status", "step"], "left");
    });

    it("2.2.4 Unfreeze columns by developers", () => {
      agHelper.ClearLocalStorageCache();
      cy.reload();
      cy.wait(1000);

      cy.freezeColumnFromDropdown("action", "left");
      cy.checkColumnPosition("action", 0);
      checkLocalColumnOrder([], "left");

      cy.freezeColumnFromDropdown("step", "right");
      cy.checkColumnPosition("step", 3);
      checkLocalColumnOrder([], "right");
    });
  });
});
