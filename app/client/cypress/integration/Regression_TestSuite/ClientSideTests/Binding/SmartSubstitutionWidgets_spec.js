const widgetLocators = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/tableAndChart.json");
const viewWidgetsPage = require("../../../../locators/ViewWidgets.json");

describe("Text-Table Binding Functionality", function() {
  const updateData = `[
  {
    "x": "Product1",
    "y": 20000
  },
  {{{
    "x": "Product2",
    "y": 22000
  }}},
  {
    "x": "Product3",
    "y": 32000
  }
]`;
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Update table data and assert", function() {
    cy.openPropertyPane("tablewidget");
    cy.get(widgetLocators.tabedataField).then(($el) => {
      cy.updateCodeInput($el, updateData);
      cy.readTabledata("1", "0").then((cellData) => {
        cy.wrap(cellData).should("equal", "Product2");
      });
    });
  });

  it("2. Update chart data and assert", function() {
    cy.openPropertyPane("chartwidget");
    cy.get(".t--property-control-chart-series-data-control").then(($el) => {
      cy.updateCodeInput($el, updateData);
      cy.get(viewWidgetsPage.chartWidget)
        .find("svg")
        .find("text")
        .should("contain.text", "Product2");

      cy.get(viewWidgetsPage.chartWidget)
        .find("svg")
        .find("rect")
        .should("have.length.greaterThan", 0);
    });
  });

  it("3. Publish and assert", function() {
    cy.PublishtheApp(false);
    cy.readTabledata("1", "0").then((cellData) => {
      cy.wrap(cellData).should("equal", "Product2");
    });
    cy.get(publish.chartWidget)
      .find("svg")
      .find("text")
      .should("contain.text", "Product2");

    cy.get(publish.chartWidget)
      .find("svg")
      .find("rect")
      .should("have.length.greaterThan", 0);
  });
});
