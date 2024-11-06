const commonlocators = require("../../../../../locators/commonlocators.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Table Widget property pane feature validation",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("tableV2NewDslWithPagination");
    });

    it("1. Verify table column type changes effect on menuButton and iconButton", function () {
      cy.openPropertyPane("tablewidgetv2");
      cy.addColumnV2("CustomColumn");
      cy.editColumn("customColumn1");
      _.propPane.SelectPropertiesDropDown("Column type", "Menu button");
      cy.wait(400);
      _.propPane.MoveToTab("Style");
      cy.get(commonlocators.selectedIcon).should("have.text", "(none)");
      cy.getTableV2DataSelector("1", "5").then((selector) => {
        cy.get(selector + " button span.bp3-icon").should("not.exist");
      });
      _.propPane.MoveToTab("Content");
      _.propPane.SelectPropertiesDropDown("Column type", "Icon button");

      cy.wait(400);
      cy.get(commonlocators.selectedIcon).should("have.text", "add");
      cy.getTableV2DataSelector("1", "5").then((selector) => {
        cy.get(selector + " button span.bp3-icon-add").should("exist");
      });
      _.propPane.SelectPropertiesDropDown("Column type", "Menu button");
      cy.wait(500);
      _.propPane.MoveToTab("Style");
      cy.get(commonlocators.selectedIcon).should("have.text", "(none)");
      cy.getTableV2DataSelector("1", "5").then((selector) => {
        cy.get(selector + " button span.bp3-icon").should("not.exist");
      });
      _.propPane.NavigateBackToPropertyPane();
    });
  },
);
