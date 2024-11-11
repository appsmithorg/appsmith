import {
  getWidgetSelector,
  PROPERTY_SELECTOR,
} from "../../../../../locators/WidgetLocators";
import * as _ from "../../../../../support/Objects/ObjectsCore";

const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");

describe(
  "Column freeze & unfreeze in canavs mode",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  () => {
    before(() => {
      cy.dragAndDropToCanvas(_.draggableWidgets.TABLE, { x: 200, y: 200 });
      _.table.AddSampleTableData();
      cy.dragAndDropToCanvas(_.draggableWidgets.TEXT, { x: 200, y: 600 });
      _.propPane.UpdatePropertyFieldValue(
        "Text",
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
          cy.openPropertyPane(_.draggableWidgets.TABLE);
          cy.deleteWidget(widgetsPage.tableWidgetV2);
        }
      });
    });
    describe(
      "1.1 Column freeze and unfreeze testing via propertypane",
      { tags: ["@tag.Widget", "@tag.Table"] },
      () => {
        it("1.1.1 Freeze column to left", () => {
          cy.openPropertyPane(_.draggableWidgets.TABLE);
          cy.openFieldConfiguration("step");
          cy.get(
            ".t--property-control-columnfreeze span[data-value='left']",
          ).click({
            force: true,
          });
          cy.checkIfColumnIsFrozenViaCSS("0", "0");

          cy.get(getWidgetSelector(_.draggableWidgets.TEXT)).should(
            "contain.text",
            '"step": "left"',
          );
        });

        it("1.1.2 Freeze column to right", () => {
          cy.get(commonlocators.editPropBackButton).click();
          cy.wait(1000);
          cy.openFieldConfiguration("action");
          cy.get(
            ".t--property-control-columnfreeze span[data-value='right']",
          ).click({
            force: true,
          });
          // Check if the first cell has position sticky:
          cy.checkIfColumnIsFrozenViaCSS("0", "3");

          cy.get(getWidgetSelector(_.draggableWidgets.TEXT)).should(
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
          cy.get(".t--property-control-columnfreeze span[data-value='']").click(
            {
              force: true,
            },
          );
          // Check if the first cell has position sticky:
          cy.getTableV2DataSelector("0", "3").then((selector) => {
            cy.get(selector).should("not.have.css", "position", "sticky");
          });
          cy.get(getWidgetSelector(_.draggableWidgets.TEXT)).should(
            "not.contain.text",
            '"action": "right"',
          );
        });

        it("1.1.4 Check column is frozen in page mode", () => {
          _.deployMode.DeployApp();
          // Check if the first cell has position sticky:
          cy.checkIfColumnIsFrozenViaCSS("0", "0");

          cy.get(getWidgetSelector(_.draggableWidgets.TEXT)).should(
            "contain.text",
            '"step": "left"',
          );
          _.deployMode.NavigateBacktoEditor();
        });
      },
    );

    describe(
      "1.2 Column freeze and unfreeze testing via dropdown",
      { tags: ["@tag.Widget", "@tag.Table"] },
      () => {
        it("1.2.1 Check if column freeze for user mode is enabled", () => {
          cy.openPropertyPane(_.draggableWidgets.TABLE);

          cy.get(
            ".t--property-control-allowcolumnfreeze input[type='checkbox']",
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
          _.deployMode.DeployApp();
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
          _.deployMode.NavigateBacktoEditor();
        });

        it("1.2.2 Check if column is freezing in the edit mode", () => {
          cy.freezeColumnFromDropdown("step", "left");
          cy.checkColumnPosition("step", 0);

          cy.freezeColumnFromDropdown("step", "left");
          cy.checkIfColumnIsFrozenViaCSS("0", "0", "sticky");

          cy.freezeColumnFromDropdown("action", "left");
          cy.checkIfColumnIsFrozenViaCSS("0", "1", "sticky");
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
          cy.openPropertyPane(_.draggableWidgets.TABLE);
          cy.get(
            ".t--property-control-allowcolumnfreeze input[type='checkbox']",
          ).click({
            force: true,
          });

          cy.get(
            ".t--property-control-allowcolumnfreeze input[type='checkbox']",
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
          _.deployMode.DeployApp();
          cy.wait(3000);
          cy.get(`[role="columnheader"] .header-menu .bp3-popover2-target`)
            .first()
            .click({
              force: true,
            });

          cy.get(".bp3-menu")
            .contains("Freeze column left")
            .should("have.class", "bp3-disabled");

          _.deployMode.NavigateBacktoEditor();
        });
      },
    );
  },
);
