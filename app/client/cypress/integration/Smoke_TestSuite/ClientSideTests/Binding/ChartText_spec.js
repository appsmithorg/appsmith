const commonlocators = require("../../../../locators/commonlocators.json");
const viewWidgetsPage = require("../../../../locators/ViewWidgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/ChartTextDsl.json");
const pages = require("../../../../locators/Pages.json");

describe("Text-Chart Binding Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Text-Chart Binding Functionality View", function() {
    cy.openPropertyPane("textwidget");
    cy.testJsontext("text", JSON.stringify(this.data.chartInputValidate));
    cy.get(commonlocators.TextInside).should(
      "have.text",
      JSON.stringify(this.data.chartInputValidate),
    );
    cy.closePropertyPane();
    cy.openPropertyPane("chartwidget");
    cy.get(viewWidgetsPage.chartType)
      .last()
      .click({ force: true });
    cy.get(".t--dropdown-option")
      .children()
      .contains("Column Chart")
      .click();
    cy.get(" .t--property-control-charttype .bp3-popover-target")
      .last()
      .should("have.text", "Column Chart");
    cy.testJsontext("chart-series-data-control", "{{Text1.text}}");
    cy.closePropertyPane();
    const labels = [
      this.data.Chartval[0],
      this.data.Chartval[1],
      this.data.Chartval[2],
    ];
    [0, 1, 2].forEach((k) => {
      cy.get(viewWidgetsPage.rectangleChart)
        .eq(k)
        .trigger("mousemove", { force: true });
      cy.get(viewWidgetsPage.Chartlabel)
        .eq(k)
        .should("have.text", labels[k]);
    });
    cy.PublishtheApp();
  });
  it("Text-Chart Binding Functionality Publish", function() {
    cy.get(publish.chartCanvasVal).should("be.visible");
    cy.get(publish.chartWidget).should("have.css", "opacity", "1");
    const labels = [
      this.data.Chartval[0],
      this.data.Chartval[1],
      this.data.Chartval[2],
    ];
    [0, 1, 2].forEach((k) => {
      cy.get(publish.rectChart)
        .eq(k)
        .trigger("mousemove", { force: true });
      cy.get(publish.chartLab)
        .eq(k)
        .should("have.text", labels[k]);
    });
    cy.get(commonlocators.TextInside).should(
      "have.text",
      JSON.stringify(this.data.chartInputValidate),
    );
  });
});

afterEach(() => {
  // put your clean up code if any
});
