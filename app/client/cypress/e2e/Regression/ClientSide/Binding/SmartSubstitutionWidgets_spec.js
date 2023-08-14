const widgetLocators = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const viewWidgetsPage = require("../../../../locators/ViewWidgets.json");
import {
  entityExplorer,
  agHelper,
  deployMode,
  locators,
} from "../../../../support/Objects/ObjectsCore";

describe("Text-Table Binding Functionality", function () {
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
    agHelper.AddDsl("tableAndChart");
  });

  it("1. Update table data and assert", function () {
    entityExplorer.SelectEntityByName("Table1");
    cy.get(widgetLocators.tabedataField).then(($el) => {
      cy.updateCodeInput($el, updateData);
      cy.readTabledata("1", "0").then((cellData) => {
        cy.wrap(cellData).should("equal", "Product2");
      });
    });
    //Update chart data and assert
    entityExplorer.SelectEntityByName("Chart1");
    cy.get(".t--property-control-chart-series-data-control").then(($el) => {
      cy.updateCodeInput($el, updateData);
      cy.get(viewWidgetsPage.chartWidget)
        .find("svg")
        .find("text")
        .should("contain.text", "Product1");

      cy.get(viewWidgetsPage.chartWidget)
        .find("svg")
        .find("rect")
        .should("have.length.greaterThan", 0);
    });
  });

  it("2. Publish and assert", function () {
    deployMode.DeployApp(locators._backToEditor, true, false);
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
