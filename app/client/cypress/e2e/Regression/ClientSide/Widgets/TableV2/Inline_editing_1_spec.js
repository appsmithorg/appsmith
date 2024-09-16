const commonlocators = require("../../../../../locators/commonlocators.json");
import { agHelper, table } from "../../../../../support/Objects/ObjectsCore";

describe(
  "Table widget inline editing functionality",
  { tags: ["@tag.Widget", "@tag.Table"] },
  () => {
    afterEach(() => {
      agHelper.SaveLocalStorageCache();
    });

    beforeEach(() => {
      agHelper.RestoreLocalStorageCache();
      agHelper.AddDsl("Table/InlineEditingDSL");
    });

    let propPaneBack = "[data-testid='t--property-pane-back-btn']";

    it("1. should check that editable property is only available for Plain text & number columns", () => {
      cy.openPropertyPane("tablewidgetv2");
      cy.editColumn("step");
      [
        {
          columnType: "URL",
          expected: "not.exist",
        },
        {
          columnType: "Number",
          expected: "exist",
        },
        {
          columnType: "Date",
          expected: "exist",
        },
        {
          columnType: "Image",
          expected: "not.exist",
        },
        {
          columnType: "Video",
          expected: "not.exist",
        },
        {
          columnType: "Button",
          expected: "not.exist",
        },
        {
          columnType: "Menu button",
          expected: "not.exist",
        },
        {
          columnType: "Icon button",
          expected: "not.exist",
        },
        {
          columnType: "Plain text",
          expected: "exist",
        },
      ].forEach((data) => {
        cy.get(commonlocators.changeColType).last().click();
        cy.get(".t--dropdown-option")
          .children()
          .contains(data.columnType)
          .click();
        cy.wait("@updateLayout");
        cy.get(".t--property-control-editable").should(data.expected);
      });
    });

    it("2. should check that inline save option is shown only when a column is made editable", () => {
      cy.openPropertyPane("tablewidgetv2");
      cy.get(".t--property-control-updatemode").should("not.exist");

      table.toggleColumnEditableViaColSettingsPane("step", "v2", true, true);
      cy.get(".t--property-control-updatemode").should("exist");
      table.toggleColumnEditableViaColSettingsPane("step", "v2", false, true);
      cy.get(".t--property-control-updatemode").should("exist");

      cy.dragAndDropToCanvas("textwidget", { x: 300, y: 600 });
      cy.openPropertyPane("textwidget");
      cy.updateCodeInput(
        ".t--property-control-text",
        `{{Table1.inlineEditingSaveOption}}`,
      );
      cy.get(".t--widget-textwidget .bp3-ui-text").should(
        "contain",
        "ROW_LEVEL",
      );
    });

    it("3. should check that save/discard column is added when a column is made editable and removed when made uneditable", () => {
      cy.openPropertyPane("tablewidgetv2");
      table.toggleColumnEditableViaColSettingsPane("step", "v2", true, true);
      cy.get("[data-rbd-draggable-id='EditActions1']").should("exist");
      cy.get(
        "[data-rbd-draggable-id='EditActions1'] input[type='text']",
      ).should("contain.value", "Save / Discard");
      cy.get("[data-colindex='4'][data-rowindex='0'] button").should(
        "be.disabled",
      );
      table.toggleColumnEditableViaColSettingsPane("step", "v2", false, true);
      cy.get("[data-rbd-draggable-id='EditActions1']").should("not.exist");

      cy.editColumn("step");
      cy.get(".t--property-control-editable .ads-v2-switch").click();
      cy.get(propPaneBack).click();
      cy.get("[data-rbd-draggable-id='EditActions1']").should("exist");
      cy.get(
        "[data-rbd-draggable-id='EditActions1'] input[type='text']",
      ).should("contain.value", "Save / Discard");
      cy.get("[data-colindex='4'][data-rowindex='0'] button").should(
        "be.disabled",
      );
      cy.editColumn("step");
      cy.get(".t--property-control-editable .ads-v2-switch").click();
      cy.get("[data-rbd-draggable-id='EditActions1']").should("not.exist");
    });
  },
);
