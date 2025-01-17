import * as _ from "../../../../../support/Objects/ObjectsCore";
const widgetsPage = require("../../../../../locators/Widgets.json");

describe(
  "Actions flow (save, discard)",
  { tags: ["@tag.All", "@tag.Table", "@tag.Sanity", "@tag.Binding"] },
  () => {
    before(() => {
      cy.startServerAndRoutes();
      _.agHelper.RestoreLocalStorageCache();
      _.agHelper.AddDsl("Table/InlineEditingDSL");
    });

    it("3.1. should test that discard button is undoing the add new feature", () => {
      cy.openPropertyPane("tablewidgetv2");
      _.propPane.TogglePropertyState("Allow adding a row", "On");
      cy.get(".tableWrap .new-row").should("not.exist");
      cy.get(".t--add-new-row").click();
      cy.get(".tableWrap .new-row").should("exist");
      cy.get(".t--discard-new-row").click({ force: true });
    });

    it("3.2. should test that discard events is triggered when user clicks on the discard button", () => {
      cy.getAlert("onDiscard", "discarded!!");
      cy.get(".t--add-new-row").click();
      cy.get(".tableWrap .new-row").should("exist");
      cy.get(".t--discard-new-row").click({ force: true });
      cy.get(widgetsPage.toastAction).should("be.visible");
      _.agHelper.AssertContains("discarded!!");
      cy.get(".tableWrap .new-row").should("not.exist");
    });

    it("3.3. should test that save event is triggered when user clicks on the save button", () => {
      cy.getAlert("onSave", "saved!!");
      cy.get(".t--add-new-row").click();
      cy.get(".tableWrap .new-row").should("exist");
      cy.get(".t--save-new-row").click({ force: true });
      cy.get(widgetsPage.toastAction).should("be.visible");
      _.agHelper.AssertContains("saved!!");
      cy.get(".tableWrap .new-row").should("not.exist");
    });
  },
);
