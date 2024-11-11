const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Table Widget row multi select validation",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("tableNewDsl");
    });

    it("1. Test multi select column shows when enable Multirowselection is true", function () {
      cy.openPropertyPane("tablewidget");
      cy.get(widgetsPage.toggleEnableMultirowselection_tablev1)
        .first()
        .click({ force: true });
      cy.closePropertyPane("tablewidget");
      cy.get(".t--table-multiselect-header").should("be.visible");
      cy.get(".t--table-multiselect").should("be.visible");
      //Test click on header cell selects all row
      // click on header check cell
      cy.get(".t--table-multiselect-header").first().click({ force: true });
      // check if rows selected
      cy.get(".tr").should("have.class", "selected-row");
      //Test click on single row cell changes header select cell state
      // un-select all rows
      cy.get(".t--table-multiselect-header").first().click({ force: true });
      // click on first row select box
      cy.get(".t--table-multiselect").first().click({ force: true }).wait(500);
      // check if header cell is in half check state
      cy.get(".t--table-multiselect-header-half-check-svg").should(
        "be.visible",
      );
    });
    it("2. Test action configured on onRowSelected get triggered whenever a table row is selected", function () {
      cy.openPropertyPane("tablewidget");
      cy.getAlert("onRowSelected", "Row Selected");
      // un select first row
      cy.get(".t--table-multiselect").first().click({ force: true });
      cy.get(commonlocators.toastmsg).should("not.exist");
      // click on first row select box
      cy.get(".t--table-multiselect").first().click({ force: true });
      cy.get(commonlocators.toastmsg).contains("Row Selected");
    });

    it("3. It should deselected default Selected Row when the header cell is clicked", () => {
      cy.openPropertyPane("tablewidget");
      cy.testJsontext("defaultselectedrow", 0);

      // click on header check cell
      cy.get(".t--table-multiselect-header").first().click({
        force: true,
      });
      // check if rows selected
      cy.get(".tr").should("not.have.class", "selected-row");

      // click on header check cell
      cy.get(".t--table-multiselect-header").first().click({
        force: true,
      });
      // check if rows is not selected
      cy.get(".tr").should("have.class", "selected-row");
    });
  },
);
