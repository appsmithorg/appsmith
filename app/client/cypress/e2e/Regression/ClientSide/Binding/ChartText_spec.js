const commonlocators = require("../../../../locators/commonlocators.json");
const viewWidgetsPage = require("../../../../locators/ViewWidgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
import {
  entityExplorer,
  agHelper,
  deployMode,
} from "../../../../support/Objects/ObjectsCore";

describe("Text-Chart Binding Functionality", function () {
  before(() => {
    agHelper.AddDsl("ChartTextDsl");
  });

  it("1. Text-Chart Binding Functionality View", function () {
    entityExplorer.SelectEntityByName("Text1", "Container3");
    cy.testJsontext("text", JSON.stringify(this.dataSet.chartInputValidate));
    cy.get(commonlocators.TextInside).should(
      "have.text",
      JSON.stringify(this.dataSet.chartInputValidate),
    );
    cy.closePropertyPane();
    entityExplorer.SelectEntityByName("Chart1", "Container1");
    cy.get(viewWidgetsPage.chartType).last().click({ force: true });
    cy.get(".t--dropdown-option").children().contains("Column chart").click();
    cy.get(".t--property-control-charttype span.rc-select-selection-item span")
      .last()
      .should("have.text", "Column chart");
    cy.testJsontext("chart-series-data-control", "{{Text1.text}}");
    cy.closePropertyPane();
    const labels = [
      this.dataSet.Chartval[0],
      this.dataSet.Chartval[1],
      this.dataSet.Chartval[2],
    ];
    [0, 2].forEach((k) => {
      cy.get(viewWidgetsPage.rectangleChart)
        .first()
        .trigger("mousemove", { force: true });
      cy.get(viewWidgetsPage.Chartlabel).contains(labels[k]);
    });
    deployMode.DeployApp();
  });

  it("2. Text-Chart Binding Functionality Publish", function () {
    cy.get(publish.chartCanvasVal).should("be.visible");
    cy.get(publish.chartWidget).should("have.css", "opacity", "1");
    const labels = [
      this.dataSet.Chartval[0],
      this.dataSet.Chartval[1],
      this.dataSet.Chartval[2],
    ];
    [0, 1, 2].forEach((k) => {
      cy.get(publish.rectChart).first().trigger("mousemove", { force: true });
      cy.get(publish.chartLab).contains(labels[k]);
    });
    cy.get(commonlocators.TextInside).should(
      "have.text",
      JSON.stringify(this.dataSet.chartInputValidate),
    );
  });
});

afterEach(() => {
  // put your clean up code if any
});
