const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const dsl = require("../../../../../fixtures/tableV2NewDsl.json");
const testdata = require("../../../../../fixtures/testdata.json");
const color = "rgb(151, 0, 0)";

describe("Table Widget V2 property pane feature validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Table widget V2 with with modal popup", function() {
    cy.openPropertyPane("tablewidgetv2");
    //update Table name with _
    cy.widgetText(
      "Table_1",
      widgetsPage.tableWidgetV2,
      commonlocators.tableV2Inner,
    );
    cy.createModal("Modal", this.data.ModalName);
    cy.isSelectRow(1);
    cy.get(".bp3-overlay-backdrop").click({ force: true });
    cy.isSelectRow(2);
    cy.get(".bp3-overlay-backdrop").click({ force: true });
  });

  it("2. Table widget V2 with button colour change validation", function() {
    cy.openPropertyPane("tablewidgetv2");
    // Open column details of "id".
    cy.editColumn("id");
    cy.get(widgetsPage.tableV2Btn).should("not.exist");
    // Changing column data type to "Button"
    cy.changeColumnType("Button");
    // Changing the computed value (data) to "orderAmount"
    cy.updateComputedValue(testdata.currentRowOrderAmt);
    cy.changeColumnType("Button");
    cy.get(widgetsPage.buttonColor)
      .click({ force: true })
      .clear()
      .type(color);
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

  it("3. Table widget icon type and colour validation", function() {
    cy.openPropertyPane("tablewidgetv2");
    // Open column details of "id".
    cy.get(commonlocators.editPropBackButton).click({ force: true });
    cy.editColumn("id");
    // Change Column type to icon Button
    cy.changeColumnType("Icon Button");
    // Select Icon from Icon Control
    cy.get(".t--property-control-icon .bp3-icon-caret-down").click({
      force: true,
    });
    cy.get(".bp3-icon-add")
      .first()
      .click({
        force: true,
      });
    cy.get(".t--widget-tablewidgetv2 .tbody .bp3-icon-add").should(
      "be.visible",
    );
  });

  it("4. Table widget v2 column reorder and reload function", function() {
    cy.openPropertyPane("tablewidgetv2");
    cy.get(commonlocators.editPropBackButton).click({ force: true });
    cy.hideColumn("email");
    cy.hideColumn("userName");
    cy.hideColumn("productName");
    cy.hideColumn("orderAmount");
    cy.readTableV2dataPublish("2", "2").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Tobias Funke");
      cy.reload();
      cy.wait(3000);
      cy.readTableV2dataPublish("2", "2").then((tabDataNew) => {
        expect(tabDataNew).to.be.equal("Tobias Funke");
      });
    });
  });
});
