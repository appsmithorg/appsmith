const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/tableNewDslWithPagination.json");
const testdata = require("../../../../fixtures/testdata.json");

describe("Table Widget property pane feature validation", function() {
  it("Verify default array data", function() {
    // Open Widget side bar
    cy.get(widgetsPage.addWidget).click();
    // Drag and drop table widget
    cy.dragAndDropToCanvas("tablewidget", { x: 300, y: 200 });
    // close Widget side bar
    cy.get(widgetsPage.closeWidgetBar).click({ force: true });
    cy.wait(2000);
    cy.SearchEntityandOpen("Table1");
    cy.readTabledataPublish("1", "1").then((tabData) => {
      const tabValue = tabData;
      cy.log(tabData);
      cy.log("computed value of plain text " + tabData);
      // Changing the Computed value from "id" to "Email"
      cy.widgetText(
        "updatedTableName",
        widgetsPage.tableWidget,
        commonlocators.tableInner,
      );
      // Reading single cell value of the table and verify it's value.
      cy.readTabledataPublish("1", "1").then((tabData2) => {
        cy.log(tabData2);
        expect(tabData).to.be.equal(tabData2);
        cy.log("computed value of plain text " + tabData2);
      });
      cy.isSelectRow(1);
      cy.readTabledataPublish("1", "1").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("");
        cy.log("the value is" + tabValue);
        cy.get(publish.searchInput)
          .first()
          .type(tabData);
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(500);
        cy.readTabledataPublish("1", "3").then((tabData) => {
          const tabValue = tabData;
          expect(tabValue).to.be.equal("");
        });
      });
    });
  });

  it.skip("Table Widget Functionality To Search The Data", function() {
    cy.isSelectRow(1);
    cy.readTabledataPublish("1", "1").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("");
      cy.log("the value is" + tabValue);
      cy.get(publish.searchInput)
        .first()
        .type(tabData);
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      cy.readTabledataPublish("1", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Lindsay Ferguson");
      });
      cy.get(publish.downloadBtn).click();
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(5000);
      cy.get(publish.searchInput)
        .first()
        .within(() => {
          return cy.get("input").clear();
        })
        .type("7434532");
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(1000);
      cy.readTabledataPublish("3", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Byron Fields");
      });
    });
  });
});
