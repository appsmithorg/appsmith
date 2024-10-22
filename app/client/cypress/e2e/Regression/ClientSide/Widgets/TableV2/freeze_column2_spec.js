import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Column freeze & unfreeze in page mode",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  () => {
    before(() => {
      cy.dragAndDropToCanvas(_.draggableWidgets.TABLE, { x: 200, y: 200 });
      _.table.AddSampleTableData();
      _.deployMode.DeployApp();
    });

    describe(
      "2.1 Column freeze and unfreeze testing with 0 pre-frozen columns",
      { tags: ["@tag.Widget", "@tag.Table"] },
      () => {
        after(() => {
          _.deployMode.NavigateBacktoEditor();
        });
        it("2.1.1 Freeze Columns left", () => {
          cy.freezeColumnFromDropdown("status", "left");
          cy.checkIfColumnIsFrozenViaCSS("0", "0");
          cy.checkColumnPosition("status", 0);
          _.table.AssertColumnFreezeStatus("status");
          //cy.checkLocalColumnOrder(["step"], "left");
          _.table.AssertTableHeaderOrder("statussteptaskaction");

          cy.freezeColumnFromDropdown("action", "left");
          cy.checkIfColumnIsFrozenViaCSS("0", "1");
          cy.checkColumnPosition("action", 1);
          //cy.checkLocalColumnOrder(["step", "action"], "left");
          _.table.AssertColumnFreezeStatus("action");
          _.table.AssertTableHeaderOrder("statusactionsteptask");
        });

        it("2.1.2 Freeze Columns right", () => {
          cy.freezeColumnFromDropdown("status", "right");
          cy.checkIfColumnIsFrozenViaCSS("0", "3");
          cy.checkColumnPosition("status", 3);
          //cy.checkLocalColumnOrder(["status"], "right");
          _.table.AssertColumnFreezeStatus("status");
          _.table.AssertTableHeaderOrder("actionsteptaskstatus");
        });

        it("2.1.3 Freeze existing left column to right", () => {
          cy.freezeColumnFromDropdown("step", "right");
          cy.checkIfColumnIsFrozenViaCSS("0", "2");
          cy.checkColumnPosition("step", 2);
          //cy.checkLocalColumnOrder(["step", "status"], "right");
          _.table.AssertColumnFreezeStatus("step");
          _.table.AssertTableHeaderOrder("actiontaskstepstatus");
        });

        it("2.1.3 Freeze existing right column to left", () => {
          cy.freezeColumnFromDropdown("status", "left");
          cy.checkIfColumnIsFrozenViaCSS("0", "1");
          cy.checkColumnPosition("status", 1);
          //cy.checkLocalColumnOrder(["action", "status"], "left");
          _.table.AssertColumnFreezeStatus("status");
          _.table.AssertTableHeaderOrder("actionstatustaskstep");
        });

        it("2.1.4 Unfreeze existing column", () => {
          cy.freezeColumnFromDropdown("status", "left"); //unfreezing from dropdown
          cy.checkColumnPosition("status", 1);
          //cy.checkLocalColumnOrder(["action"], "left");
          _.table.AssertColumnFreezeStatus("status", false);
          _.table.AssertColumnFreezeStatus("action");
          _.table.AssertTableHeaderOrder("actionstatustaskstep");

          cy.freezeColumnFromDropdown("action", "left");
          cy.checkColumnPosition("action", 0);
          //cy.checkLocalColumnOrder([], "left");
          _.table.AssertColumnFreezeStatus("action", false);
          _.table.AssertTableHeaderOrder("actionstatustaskstep");

          cy.freezeColumnFromDropdown("step", "right");
          cy.checkColumnPosition("step", 3);
          //cy.checkLocalColumnOrder([], "right");
          _.table.AssertColumnFreezeStatus("step", false);
          _.table.AssertTableHeaderOrder("actionstatustaskstep");
        });
      },
    );

    describe(
      "2.2 Column freeze and unfreeze testing with multiple pre-frozen columns",
      { tags: ["@tag.Widget", "@tag.Table"] },
      () => {
        after(() => {
          _.deployMode.NavigateBacktoEditor();
        });
        it("2.2.1 Freeze column left", () => {
          // Freeze additional column in editor mode
          cy.freezeColumnFromDropdown("action", "left");
          cy.checkColumnPosition("action", 0);
          cy.freezeColumnFromDropdown("step", "right");
          cy.checkColumnPosition("step", 3);

          _.deployMode.DeployApp();

          // User frozen columns
          cy.freezeColumnFromDropdown("status", "left");
          cy.checkColumnPosition("status", 1);
          cy.checkIfColumnIsFrozenViaCSS("0", "1");
          //cy.checkLocalColumnOrder(["action", "status"], "left");
          _.table.AssertColumnFreezeStatus("action");
          _.table.AssertColumnFreezeStatus("status");
          _.table.AssertColumnFreezeStatus("step");
          _.table.AssertTableHeaderOrder("actionstatustaskstep");
        });

        it("2.2.2 Freeze developer left frozen column to right", () => {
          cy.freezeColumnFromDropdown("action", "right");
          cy.checkColumnPosition("action", 2);
          cy.checkIfColumnIsFrozenViaCSS("0", "2");
          //cy.checkLocalColumnOrder(["status"], "left");
          //cy.checkLocalColumnOrder(["action", "step"], "right");
          _.table.AssertColumnFreezeStatus("action");
          _.table.AssertColumnFreezeStatus("status");
          _.table.AssertColumnFreezeStatus("step");
          _.table.AssertTableHeaderOrder("statustaskactionstep");
        });

        it("2.2.3 Freeze developer right frozen column to left", () => {
          cy.freezeColumnFromDropdown("step", "left");
          cy.checkColumnPosition("step", 1);
          cy.checkIfColumnIsFrozenViaCSS("0", "1");
          //cy.checkLocalColumnOrder(["status", "step"], "left");
          _.table.AssertColumnFreezeStatus("step");
          _.table.AssertColumnFreezeStatus("status");
          _.table.AssertColumnFreezeStatus("action");
          _.table.AssertTableHeaderOrder("statussteptaskaction");
        });

        it("2.2.4 Unfreeze columns by developers", () => {
          cy.freezeColumnFromDropdown("action", "right");
          cy.checkColumnPosition("status", 0);
          //cy.checkLocalColumnOrder([], "left");
          _.table.AssertColumnFreezeStatus("action", false);
          _.table.AssertTableHeaderOrder("statussteptaskaction");

          cy.freezeColumnFromDropdown("step", "left");
          cy.checkColumnPosition("step", 1);
          //cy.checkLocalColumnOrder([], "right");
          _.table.AssertColumnFreezeStatus("action", false);
          _.table.AssertTableHeaderOrder("statussteptaskaction");
        });
      },
    );

    describe(
      "2.3 Hiding frozen columns",
      { tags: ["@tag.Widget", "@tag.Table"] },
      () => {
        it("2.3.1 Hide left frozen column and check it's position is before right frozen columns", () => {
          cy.openPropertyPane(_.draggableWidgets.TABLE);
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
      },
    );
  },
);
