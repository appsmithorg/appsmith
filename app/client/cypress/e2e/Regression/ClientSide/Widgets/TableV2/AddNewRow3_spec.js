import {
  agHelper,
  propPane,
  table,
} from "../../../../../support/Objects/ObjectsCore";
const widgetsPage = require("../../../../../locators/Widgets.json");

describe(
  "Actions flow (save, discard)",
  { tags: ["@tag.Widget", "@tag.Table"] },
  () => {
    before(() => {
      cy.startServerAndRoutes();
      agHelper.RestoreLocalStorageCache();
      agHelper.AddDsl("Table/InlineEditingDSL");
    });

    it("3.1. should test that discard button is undoing the add new feature", () => {
      cy.openPropertyPane("tablewidgetv2");
      propPane.TogglePropertyState("Allow adding a row", "On");
      cy.get(".tableWrap .new-row").should("not.exist");
      cy.get(".t--add-new-row").click();
      cy.get(".tableWrap .new-row").should("exist");
      cy.get(".t--discard-new-row").click({ force: true });
      cy.getAlert("onDiscard", "discarded!!");
    });

    it("3.2. should test that discard events is triggered when user clicks on the discard button", () => {
      cy.get(".t--add-new-row").click();
      cy.get(".tableWrap .new-row").should("exist");
      cy.get(".t--discard-new-row").click({ force: true });
      cy.get(widgetsPage.toastAction).should("be.visible");
      agHelper.AssertContains("discarded!!");
      cy.get(".tableWrap .new-row").should("not.exist");
      cy.getAlert("onSave", "saved!!");
    });

    it("3.3. should test that save event is triggered when user clicks on the save button", () => {
      cy.get(".t--add-new-row").click();
      cy.get(".tableWrap .new-row").should("exist");
      cy.get(".t--save-new-row").click({ force: true });
      cy.get(widgetsPage.toastAction).should("be.visible");
      agHelper.AssertContains("saved!!");
      cy.get(".tableWrap .new-row").should("not.exist");
    });

    it("3.4. should test that if save event throws an error, the save row is not doscarded", () => {
      propPane.ToggleJSMode("onSave");
      propPane.UpdatePropertyFieldValue(
        "onSave",
        `{{
          (function test(){
            throw new Error("Save failed!!");
          })()
        }}`,
      );
      agHelper.AssertElementAbsence(table._newRow);
      agHelper.GetNClick(table._addNewRow);
      agHelper.AssertElementExist(table._newRow);
      agHelper.GetNClick(table._saveNewRow, 0, true);
      agHelper.ValidateToastMessage("Save failed!!");
      agHelper.AssertElementExist(table._newRow);
      // cleanup
      propPane.UpdatePropertyFieldValue("onSave", "");
      agHelper.GetNClick(table._discardRow, 0, true);
    });
  },
);
