const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const testdata = require("../../../../../fixtures/testdata.json");
const color = "rgb(151, 0, 0)";
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Table Widget property pane feature validation",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("tableNewDsl");
    });

    it("1. Table widget with with modal popup", function () {
      cy.openPropertyPane("tablewidget");
      //update Table name with _
      cy.widgetText(
        "Table_1",
        widgetsPage.tableWidget,
        widgetsPage.widgetNameSpan,
      );
      cy.createModal("Modal", "onRowSelected");
      _.table.SelectTableRow(1);
      cy.get(".bp3-overlay-backdrop").click({ force: true });
      _.table.SelectTableRow(2);
      cy.get(".bp3-overlay-backdrop").click({ force: true });
    });

    it("2. Table widget with button colour change validation", function () {
      cy.openPropertyPane("tablewidget");
      // Open column details of "id".
      cy.editColumn("id");
      cy.get(widgetsPage.tableBtn).should("not.exist");
      // Changing column data type to "Button"
      cy.changeColumnType("Button", false);
      // Changing the computed value (data) to "orderAmount"
      cy.updateComputedValue(testdata.currentRowOrderAmt);
      cy.changeColumnType("Button", false);
      cy.get(widgetsPage.buttonColor)
        .click({ force: true })
        .clear()
        .type(color, { delay: 0 });
      cy.get(widgetsPage.tableBtn).should(
        "have.css",
        "background-color",
        color,
      );
      cy.readTabledataPublish("2", "2").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Tobias Funke");
      });
    });

    it("3. Table widget icon type and colour validation", function () {
      cy.openPropertyPane("tablewidget");
      // Open column details of "id".
      cy.get(commonlocators.editPropBackButton).click({ force: true });
      cy.editColumn("id");
      // Change Column type to icon Button
      cy.changeColumnType("Icon button", false);
      // Select Icon from Icon Control
      cy.get(".t--property-control-icon .bp3-icon-caret-down").click({
        force: true,
      });
      cy.get(".bp3-icon-add").first().click({
        force: true,
      });
      cy.get(".t--widget-tablewidget .tbody .bp3-icon-add").should(
        "be.visible",
      );
      cy.get(".bp3-overlay-backdrop").click({ force: true });
    });

    it("4. Table widget validation of a field without js ", function () {
      cy.openPropertyPane("tablewidget");
      cy.editColumn("email");
      cy.clearPropertyValue(0);
      //toggle js for visiblity
      cy.get(".t--property-control-visible .t--js-toggle").click({
        force: true,
      });
      cy.EnableAllCodeEditors();
      cy.clearPropertyValue(1);
    });

    it("5. Table widget column reorder and reload function", function () {
      cy.openPropertyPane("tablewidget");
      cy.get(commonlocators.editPropBackButton).click({ force: true });
      cy.hideColumn("email");
      cy.hideColumn("userName");
      cy.hideColumn("productName");
      cy.hideColumn("orderAmount");
      cy.readTabledataPublish("2", "2").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Tobias Funke");
        _.agHelper.RefreshPage();
        cy.readTabledataPublish("2", "2").then((tabDataNew) => {
          expect(tabDataNew).to.be.equal("Tobias Funke");
        });
      });
    });
  },
);
