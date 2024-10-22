const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Table widget inline editing validation functionality",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  () => {
    afterEach(() => {
      _.agHelper.SaveLocalStorageCache();
    });

    beforeEach(() => {
      _.agHelper.RestoreLocalStorageCache();
      _.agHelper.AddDsl("Table/InlineEditingDSL");
    });

    it("1. should check that validation only appears when editable enabled", () => {
      cy.openPropertyPane("tablewidgetv2");
      cy.editColumn("step");
      cy.get(".t--property-pane-section-collapse-validation").should(
        "not.exist",
      );
      _.propPane.TogglePropertyState("Editable", "On");
      cy.get(".t--property-pane-section-collapse-validation").should("exist");
      _.propPane.TogglePropertyState("Editable", "Off");
      cy.get(".t--property-pane-section-collapse-validation").should(
        "not.exist",
      );
    });

    it("2. should check that validation only appears for plain text and number", () => {
      cy.openPropertyPane("tablewidgetv2");
      cy.editColumn("step");
      _.propPane.TogglePropertyState("Editable", "On");
      cy.get(".t--property-pane-section-collapse-validation").should("exist");
      cy.get(commonlocators.changeColType).last().click();
      cy.get(".t--dropdown-option").children().contains("Number").click();
      cy.wait("@updateLayout");
      cy.get(".t--property-pane-section-collapse-validation").should("exist");
      cy.get(commonlocators.changeColType).last().click();
      cy.get(".t--dropdown-option").children().contains("Plain text").click();
      cy.wait("@updateLayout");
      cy.get(".t--property-pane-section-collapse-validation").should("exist");
      cy.get(commonlocators.changeColType).last().click();
      cy.get(".t--dropdown-option").children().contains("Date").click();
      cy.wait("@updateLayout");
      cy.get(".t--property-pane-section-collapse-validation").should("exist");
      cy.get(commonlocators.changeColType).last().click();
      cy.get(".t--dropdown-option").children().contains("Plain text").click();
      cy.wait("@updateLayout");
      cy.get(".t--property-pane-section-collapse-validation").should("exist");
    });

    it("3. should check that regex, valid & required appear for plain text column", () => {
      cy.openPropertyPane("tablewidgetv2");
      cy.editColumn("step");
      _.propPane.TogglePropertyState("Editable", "On");
      cy.get(".t--property-pane-section-collapse-validation").should("exist");
      ["regex", "valid", "errormessage", "required"].forEach((property) => {
        cy.get(`.t--property-control-${property}`).should("exist");
      });
    });

    it("4. should check that min, max, regex, valid & required appear for number column", () => {
      cy.openPropertyPane("tablewidgetv2");
      cy.editColumn("step");
      _.propPane.TogglePropertyState("Editable", "On");
      cy.get(commonlocators.changeColType).last().click();
      cy.get(".t--dropdown-option").children().contains("Number").click();
      cy.wait("@updateLayout");
      cy.get(".t--property-pane-section-collapse-validation").should("exist");
      ["min", "max", "regex", "valid", "errormessage", "required"].forEach(
        (property) => {
          cy.get(`.t--property-control-${property}`).should("exist");
        },
      );
    });

    describe(
      "5. should check validation property for plain text column",
      { tags: ["@tag.Widget", "@tag.Table"] },
      () => {
        it("a. Regex", () => {
          cy.openPropertyPane("tablewidgetv2");
          cy.editColumn("step");
          _.propPane.TogglePropertyState("Editable", "On");
          _.propPane.UpdatePropertyFieldValue("Regex", "^#1$");
          cy.editTableCell(0, 0);
          cy.wait(500);
          cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
          cy.enterTableCellValue(0, 0, "22");
          cy.get(`.t--inlined-cell-editor-has-error`).should("exist");
          cy.enterTableCellValue(0, 0, "#1");
          cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
        });

        it("b. Valid", () => {
          cy.openPropertyPane("tablewidgetv2");
          cy.editColumn("step");
          _.propPane.TogglePropertyState("Editable", "On");
          _.propPane.UpdatePropertyFieldValue(
            "Valid",
            "{{editedValue === '#1'}}",
          );
          cy.editTableCell(0, 0);
          cy.wait(500);
          cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
          cy.enterTableCellValue(0, 0, "22");
          cy.get(`.t--inlined-cell-editor-has-error`).should("exist");
          cy.enterTableCellValue(0, 0, "#1");
          cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
        });

        it("c. Required", () => {
          cy.openPropertyPane("tablewidgetv2");
          cy.editColumn("step");
          _.propPane.TogglePropertyState("Editable", "On");
          _.propPane.TogglePropertyState("Required", "On");
          cy.editTableCell(0, 0);
          cy.wait(500);
          cy.get(`.t--inlined-cell-editor-has-error`).should("exist");
          cy.enterTableCellValue(0, 0, "22");
          cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
          cy.enterTableCellValue(0, 0, "#1");
          cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
          cy.enterTableCellValue(0, 0, "");
          cy.get(`.t--inlined-cell-editor-has-error`).should("exist");
        });
      },
    );

    describe(
      "6. should check validation property for number column",
      { tags: ["@tag.Widget", "@tag.Table"] },
      () => {
        it("a. Min", () => {
          cy.openPropertyPane("tablewidgetv2");
          cy.editColumn("step");
          _.propPane.TogglePropertyState("Editable", "On");

          cy.get(commonlocators.changeColType).last().click();
          cy.get(".t--dropdown-option").children().contains("Number").click();
          cy.wait("@updateLayout");

          _.propPane.UpdatePropertyFieldValue("Min", "5");

          cy.editTableCell(0, 0);
          cy.wait(500);
          cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
          cy.enterTableCellValue(0, 0, "6");
          cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
          cy.enterTableCellValue(0, 0, "7");
          cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
          cy.enterTableCellValue(0, 0, "4");
          cy.get(`.t--inlined-cell-editor-has-error`).should("exist");
          cy.enterTableCellValue(0, 0, "3");
          cy.get(`.t--inlined-cell-editor-has-error`).should("exist");
          cy.enterTableCellValue(0, 0, "8");
          cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
        });

        it("b. Max", () => {
          cy.openPropertyPane("tablewidgetv2");
          cy.editColumn("step");
          _.propPane.TogglePropertyState("Editable", "On");

          cy.get(commonlocators.changeColType).last().click();
          cy.get(".t--dropdown-option").children().contains("Number").click();
          cy.wait("@updateLayout");

          _.propPane.UpdatePropertyFieldValue("Max", "5");

          cy.editTableCell(0, 0);
          cy.wait(500);
          cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
          cy.enterTableCellValue(0, 0, "6");
          cy.get(`.t--inlined-cell-editor-has-error`).should("exist");
          cy.enterTableCellValue(0, 0, "7");
          cy.get(`.t--inlined-cell-editor-has-error`).should("exist");
          cy.enterTableCellValue(0, 0, "4");
          cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
          cy.enterTableCellValue(0, 0, "3");
          cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
          cy.enterTableCellValue(0, 0, "8");
          cy.get(`.t--inlined-cell-editor-has-error`).should("exist");
        });
      },
    );

    it("7. should check the error message property", () => {
      cy.openPropertyPane("tablewidgetv2");
      cy.editColumn("step");
      _.propPane.TogglePropertyState("Editable", "On");
      _.propPane.UpdatePropertyFieldValue("Valid", "{{editedValue === '#1'}}");
      _.propPane.UpdatePropertyFieldValue(
        "Error message",
        "You got error mate!!",
      );
      cy.editTableCell(0, 0);
      cy.wait(1000);
      cy.enterTableCellValue(0, 0, "123");
      cy.get(".bp3-overlay.error-tooltip .bp3-popover-content").should(
        "contain",
        "You got error mate!!",
      );
    });

    describe(
      "8. should check the editable cell actions when there is a validation error",
      { tags: ["@tag.Widget", "@tag.Table"] },
      () => {
        it("a. save should only work when there is no error", () => {
          cy.openPropertyPane("tablewidgetv2");
          cy.editColumn("step");
          _.propPane.TogglePropertyState("Editable", "On");
          cy.getAlert("onSubmit", "Saved!!");
          _.propPane.UpdatePropertyFieldValue(
            "Valid",
            "{{editedValue === '#1'}}",
          );
          cy.editTableCell(0, 0);
          cy.enterTableCellValue(0, 0, "123");
          cy.get(`.t--inlined-cell-editor`).should("exist");
          cy.get(`.t--inlined-cell-editor-has-error`).should("exist");
          cy.saveTableCellValue(0, 0);
          cy.wait(500);
          cy.get(`.t--inlined-cell-editor`).should("exist");
          cy.get(`.t--inlined-cell-editor-has-error`).should("exist");
          cy.get(widgetsPage.toastAction).should("not.exist");
          cy.enterTableCellValue(0, 0, "#1");
          cy.saveTableCellValue(0, 0);
          cy.get(`.t--inlined-cell-editor`).should("not.exist");
          cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
          cy.get(widgetsPage.toastAction).should("be.visible");
          cy.get(widgetsPage.toastActionText)
            .last()
            .invoke("text")
            .then((text) => {
              expect(text).to.equal("Saved!!");
            });
        });

        it("b. discard should only work when there is no error", () => {
          cy.openPropertyPane("tablewidgetv2");
          cy.editColumn("step");
          _.propPane.TogglePropertyState("Editable", "On");
          _.propPane.UpdatePropertyFieldValue(
            "Valid",
            "{{editedValue === '#1'}}",
          );
          cy.editTableCell(0, 0);
          cy.enterTableCellValue(0, 0, "123");
          cy.get(`.t--inlined-cell-editor`).should("exist");
          cy.get(`.t--inlined-cell-editor-has-error`).should("exist");
          cy.discardTableCellValue(0, 0);
          cy.wait(500);
          cy.get(`.t--inlined-cell-editor`).should("not.exist");
          cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
          cy.readTableV2data(0, 0).then((val) => {
            expect(val).to.equal("");
          });

          cy.editTableCell(0, 0);
          cy.enterTableCellValue(0, 0, "#1");
          cy.get(`.t--inlined-cell-editor`).should("exist");
          cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
          cy.discardTableCellValue(0, 0);
          cy.wait(500);
          cy.get(`.t--inlined-cell-editor`).should("not.exist");
          cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
          cy.readTableV2data(0, 0).then((val) => {
            expect(val).to.equal("");
          });
        });
      },
    );

    it("should check that save/discard button is disabled when there is a validation error", () => {
      cy.openPropertyPane("tablewidgetv2");
      cy.editColumn("step");
      _.propPane.TogglePropertyState("Editable", "On");
      _.propPane.UpdatePropertyFieldValue("Valid", "{{editedValue === '#1'}}");
      cy.editTableCell(0, 0);
      cy.enterTableCellValue(0, 0, "123");
      cy.openPropertyPane("tablewidgetv2");
      cy.get(`[data-colindex="${4}"][data-rowindex="${0}"] button`).should(
        "be.disabled",
      );
      cy.enterTableCellValue(0, 0, "#1");
      cy.openPropertyPane("tablewidgetv2");
      cy.get(`[data-colindex="${4}"][data-rowindex="${0}"] button`).should(
        "not.be.disabled",
      );
    });
  },
);
