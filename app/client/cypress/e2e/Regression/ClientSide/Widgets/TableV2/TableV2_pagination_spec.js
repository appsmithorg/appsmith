const commonlocators = require("../../../../../locators/commonlocators.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Table Widget property pane feature validation",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Sanity"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("tableV2NewDslWithPagination");
    });

    it("1. updates previous and next pagination propeties properly in non server side pagination mode", function () {
      cy.openPropertyPane("tablewidgetv2");

      // The text field has two bindings in its text value, as below
      // "{{Table1.previousPageVisited}} {{Table1.nextPageVisited}}"

      // Click on next page
      cy.get(".t--table-widget-next-page").click();
      cy.get(commonlocators.bodyTextStyle).should("have.text", "false true");

      // Click on previous page
      cy.get(".t--table-widget-prev-page").click();
      cy.get(commonlocators.bodyTextStyle).should("have.text", "true false");

      // Type and go to next page
      cy.get(".t--table-widget-page-input .bp3-input").clear().type("2{enter}");
      cy.get(commonlocators.bodyTextStyle).should("have.text", "false true");

      // Type and go to previous page
      cy.get(".t--table-widget-page-input .bp3-input").clear().type("1{enter}");
      cy.get(commonlocators.bodyTextStyle).should("have.text", "true false");

      // pagination flags should get reset whenever a user searches for any text

      _.table.SearchTable("Michael Lawson");
      cy.get(commonlocators.bodyTextStyle).should("have.text", "false false");
      _.table.ResetSearch();

      // Pagination properties should get reset when user filters for any criteria.
      cy.get(".t--table-widget-next-page").click();
      cy.get(commonlocators.bodyTextStyle).should("have.text", "false true");
      _.table.OpenNFilterTable("userName", "contains", "Michael Lawson");
      cy.get(commonlocators.bodyTextStyle).should("have.text", "false false");
      _.table.RemoveFilter();

      cy.get(".t--table-widget-next-page").click();
      cy.get(commonlocators.bodyTextStyle).should("have.text", "false true");

      // pagination properties should work in server side mode
      cy.CheckWidgetProperties(commonlocators.serverSidePaginationCheckbox);
      cy.get(commonlocators.bodyTextStyle).should("have.text", "false false");

      // Click on next page
      cy.get(".t--table-widget-next-page").click();
      cy.get(commonlocators.bodyTextStyle).should("have.text", "false true");

      // Click on previous page
      cy.get(".t--table-widget-prev-page").click();
      cy.get(commonlocators.bodyTextStyle).should("have.text", "true false");
    });
  },
);
