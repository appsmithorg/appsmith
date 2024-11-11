const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const testdata = require("../../../../../fixtures/testdata.json");
const color = "rgb(151, 0, 0)";
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Table Widget V2 property pane feature validation",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("tableV2NewDsl");
    });

    it("1. Table widget V2 with with modal popup", function () {
      cy.openPropertyPane("tablewidgetv2");
      //update Table name with _
      cy.widgetText(
        "Table_1",
        widgetsPage.tableWidgetV2,
        widgetsPage.widgetNameSpan,
      );
      //cy.createModal("Modal", this.dataSet.ModalName);
      cy.createModal("Modal", "onRowSelected");
      _.table.SelectTableRow(1, 0, true, "v2");
      cy.get(".bp3-overlay-backdrop").last().click({ force: true });
      _.table.SelectTableRow(2, 0, true, "v2");
      cy.get(".bp3-overlay-backdrop").last().click({ force: true });
    });

    it("2. Table widget V2 with button colour change validation", function () {
      cy.openPropertyPane("tablewidgetv2");
      // Open column details of "id".
      cy.editColumn("id");
      cy.get(widgetsPage.tableV2Btn).should("not.exist");
      // Changing column data type to "Button"
      cy.changeColumnType("Button");
      // Changing the computed value (data) to "orderAmount"
      cy.updateComputedValue(testdata.currentRowOrderAmt);
      cy.changeColumnType("Button");
      cy.moveToStyleTab();
      cy.get(widgetsPage.buttonColor)
        .click({ force: true })
        .clear()
        .type(color, { delay: 0 });
      cy.get(widgetsPage.tableV2Btn).should(
        "have.css",
        "background-color",
        color,
      );
      cy.readTableV2dataPublish("2", "2").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Tobias Funke");
      });
    });

    it("3. Table widget icon type and colour validation", function () {
      cy.openPropertyPane("tablewidgetv2");
      // Open column details of "id".
      cy.get(commonlocators.editPropBackButton).click({ force: true });
      cy.editColumn("id");
      // Change Column type to icon Button
      cy.moveToContentTab();
      cy.changeColumnType("Icon button");
      // Select Icon from Icon Control
      cy.get(".t--property-control-icon .bp3-icon-caret-down").click({
        force: true,
      });
      cy.get(".bp3-icon-add").first().click({
        force: true,
      });
      cy.get(".t--widget-tablewidgetv2 .tbody .bp3-icon-add").should(
        "be.visible",
      );
    });

    it("4. Table widget v2 column reorder and reload function", function () {
      cy.openPropertyPane("tablewidgetv2");
      cy.get(commonlocators.editPropBackButton).click({ force: true });
      cy.hideColumn("email");
      cy.hideColumn("userName");
      cy.hideColumn("productName");
      cy.hideColumn("orderAmount");
      cy.readTableV2dataPublish("2", "2").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Tobias Funke");
        _.agHelper.RefreshPage();
        cy.wait(3000);
        cy.readTableV2dataPublish("2", "2").then((tabDataNew) => {
          expect(tabDataNew).to.be.equal("Tobias Funke");
        });
      });
    });
  },
);
