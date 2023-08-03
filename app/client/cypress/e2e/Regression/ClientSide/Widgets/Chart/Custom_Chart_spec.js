const viewWidgetsPage = require("../../../../../locators/ViewWidgets.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Chart Widget Functionality around custom chart feature", function () {
  before(() => {
    _.agHelper.AddDsl("chartUpdatedDsl");
  });

  beforeEach(() => {
    cy.openPropertyPane("chartwidget");
  });

  it("1. Fill the Chart Widget Properties.", function () {
    //changing the Chart Name
    /**
     * @param{Text} Random Text
     * @param{ChartWidget}Mouseover
     * @param{ChartPre Css} Assertion
     */
    cy.widgetText(
      "Test",
      viewWidgetsPage.chartWidget,
      widgetsPage.widgetNameSpan,
    );
    //changing the Chart Title
    /**
     * @param{Text} Random Input Value
     */
    cy.testJsontext("title", this.dataSet.chartIndata);
    cy.get(viewWidgetsPage.chartInnerText)
      .contains("App Sign Up")
      .should("have.text", "App Sign Up");

    //Entering the Chart data
    cy.testJsontext(
      "chart-series-data-control",
      JSON.stringify(this.dataSet.chartInput),
    );
    cy.get(".t--propertypane").click("right");

    // Asserting Chart Height
    cy.get(viewWidgetsPage.chartWidget)
      .should("be.visible")
      .and((chart) => {
        expect(chart.height()).to.be.greaterThan(200);
      });

    //Entring the label of x-axis
    cy.get(viewWidgetsPage.xlabel)
      .click({ force: true })
      .type(this.dataSet.command)
      .type(this.dataSet.plan);
    //Entring the label of y-axis
    cy.get(viewWidgetsPage.ylabel)
      .click({ force: true })
      .type(this.dataSet.command)
      .click({ force: true })
      .type(this.dataSet.ylabel);

    //Close edit prop

    _.deployMode.DeployApp();
  });

  it("2. Custom Chart Widget Functionality", function () {
    //changing the Chart type
    //cy.get(widgetsPage.toggleChartType).click({ force: true });
    cy.UpdateChartType("Custom chart");

    cy.testJsontext(
      "customfusionchart",
      `{{${JSON.stringify(this.dataSet.ChartCustomConfig)}}}`,
    );

    //Verifying X-axis labels
    cy.get(viewWidgetsPage.chartWidget).should("have.css", "opacity", "1");
    const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
    [0, 1, 2, 3, 4, 5, 6].forEach((k) => {
      cy.get(viewWidgetsPage.fusionRectangleChart)
        .eq(k)
        .trigger("mousemove", { force: true });
      cy.get(viewWidgetsPage.FusionChartlabel)
        .eq(k)
        .should("have.text", labels[k]);
    });
    _.deployMode.DeployApp();
  });

  it("3. Toggle JS - Custom Chart Widget Functionality", function () {
    cy.get(widgetsPage.toggleChartType).click({ force: true });
    //changing the Chart type
    cy.testJsontext("charttype", "CUSTOM_FUSION_CHART");
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(viewWidgetsPage.FusionChartlabel + ":first-child", {
      timeout: 10000,
    }).should("have.css", "opacity", "1");
    //Verifying X-axis labels
    cy.get(viewWidgetsPage.chartWidget).should("have.css", "opacity", "1");
    const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
    [0, 1, 2, 3, 4, 5, 6].forEach((k) => {
      cy.get(viewWidgetsPage.fusionRectangleChart)
        .eq(k)
        .trigger("mousemove", { force: true });
      cy.get(viewWidgetsPage.FusionChartlabel)
        .eq(k)
        .should("have.text", labels[k]);
    });

    //Close edit prop
    _.deployMode.DeployApp(_.locators._backToEditor, true, false);
  });

  it("4. Chart-Copy & Delete Verification", function () {
    //Copy Chart and verify all properties
    cy.wait(1000);
    _.entityExplorer.ExpandCollapseEntity("Widgets");
    _.entityExplorer.ExpandCollapseEntity("Container3");
    _.propPane.CopyWidgetFromPropertyPane("Test");
    _.deployMode.DeployApp();
    //Chart-Delete Verification"
    _.deployMode.NavigateBacktoEditor();
    _.entityExplorer.ExpandCollapseEntity("Widgets");
    _.entityExplorer.ExpandCollapseEntity("Container3");
    _.propPane.DeleteWidgetFromPropertyPane("TestCopy");
    _.deployMode.DeployApp();
    cy.get(viewWidgetsPage.chartWidget).should("not.exist");
  });

  afterEach(() => {
    _.deployMode.NavigateBacktoEditor();
  });
});
