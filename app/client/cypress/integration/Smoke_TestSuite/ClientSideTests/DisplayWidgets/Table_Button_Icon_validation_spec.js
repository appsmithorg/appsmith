const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/tableNewDsl.json");
const pages = require("../../../../locators/Pages.json");
const testdata = require("../../../../fixtures/testdata.json");
const color = "rgb(151, 0, 0)";
const newcolor = "rgb(250, 0, 0)";

describe("Table Widget property pane feature validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Table widget with button colour change validation", function() {
    cy.openPropertyPane("tablewidget");
    //update Table name with _
    cy.widgetText(
      "Table_1",
      widgetsPage.tableWidget,
      commonlocators.tableInner,
    );
    // Open column details of "id".
    cy.editColumn("id");
    cy.get(widgetsPage.tableBtn).should("not.exist");
    // Changing column data type to "Button"
    cy.changeColumnType("Button");
    // Changing the computed value (data) to "orderAmount"
    cy.updateComputedValue(testdata.currentRowOrderAmt);
    cy.changeColumnType("Button");
    cy.get(widgetsPage.buttonColor)
      .click({ force: true })
      .clear()
      .type(color);
    // Close Property pane
    cy.get(commonlocators.editPropCrossButton).click({ force: true });
    cy.get(widgetsPage.tableBtn).should("have.css", "background-color", color);
    cy.readTabledataPublish("2", "2").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Tobias Funke");
    });
  });

  it("Table widget icon type and colour validation", function() {
    cy.openPropertyPane("tablewidget");
    // Open column details of "id".
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
    cy.get(".t--widget-tablewidget .tbody .bp3-icon-add").should("be.visible");
    cy.get(commonlocators.editPropCrossButton).click({ force: true });
  });

  it("Table widget ", function() {
    cy.openPropertyPane("tablewidget");
    cy.editColumn("email");
    cy.clearPropertyValue(0);
    //toggle js for visiblity
    cy.get(".t--property-control-visible .t--js-toggle").click({ force: true });
    cy.clearPropertyValue(1);
    cy.get(commonlocators.editPropCrossButton).click({ force: true });
  });

  it.skip("Table widget column reorder and reload function", function() {
    cy.openPropertyPane("tablewidget");
    cy.hideColumn("email");
    cy.hideColumn("userName");
    cy.hideColumn("productName");
    cy.hideColumn("orderAmount");
    cy.readTabledataPublish("2", "2").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Tobias Funke");
      cy.reload();
      cy.wait(3000);
      cy.readTabledataPublish("2", "2").then((tabDataNew) => {
        expect(tabValue).not.to.be.equal("Tobias Funke");
      });
    });
  });
});
